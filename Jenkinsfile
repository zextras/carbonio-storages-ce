// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

def buildContainer(String title, String description, String dockerfile, String tag) {
    sh 'docker build ' +
            '--label org.opencontainers.image.title="' + title + '" ' +
            '--label org.opencontainers.image.description="' + description + '" ' +
            '--label org.opencontainers.image.vendor="Zextras" ' +
            '-f ' + dockerfile + ' -t ' + tag + ' .'
    sh 'docker push ' + tag
}

pipeline {
    parameters {
        booleanParam defaultValue: false, description: 'Whether to upload the packages in playground repositories', name: 'PLAYGROUND'
    }
    options {
        skipDefaultCheckout()
        buildDiscarder(logRotator(numToKeepStr: '5'))
        timeout(time: 3, unit: 'HOURS')
    }
    agent {
        node {
            label 'yap-ubuntu-20-v1'
        }
    }
    stages {
        stage('Fetch sources') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
                }
                stash includes: '**', name: 'project'
            }
        }
        stage('Launch tests') {
            steps {
                container('yap') {
                    unstash 'project'
                    sh 'apt-get update'
                    sh 'apt-get install -y ca-certificates curl gnupg'
                    sh 'mkdir -p /etc/apt/keyrings'
                    sh 'curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg'
                    sh 'echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list'
                    sh 'apt-get update'
                    sh 'apt-get install nodejs -y'
                    sh 'npm install && npm run build && npm run test'
                }
            }
        }
        stage('Packaging...') {
            parallel {
                stage('Build and Publish Docker Image - Dev') {
                    agent {
                        node {
                            label 'zextras-v1'
                        }
                    }
                    when {
                        not {
                            buildingTag()
                        }
                        not {
                            expression { env.BRANCH_NAME.startsWith("PR-") }
                        }
                    }
                    steps {
                        container('dind') {
                            unstash 'project'
                            withDockerRegistry(credentialsId: 'private-registry', url: 'https://registry.dev.zextras.com') {
                                script {
                                    def branchTag = env.BRANCH_NAME.replaceAll('/', '-').toLowerCase()
                                    def imageTag = "registry.dev.zextras.com/dev/carbonio-storages-ce:${branchTag}"

                                    buildContainer(
                                        'Carbonio storages CE',
                                        'Carbonio storages CE',
                                        'Dockerfile',
                                        imageTag
                                    )

                                    // alias "latest" for last build of develop
                                    if (env.BRANCH_NAME == 'devel') {
                                        def latestTag = "registry.dev.zextras.com/dev/carbonio-storages-ce:latest"

                                        sh "docker tag ${imageTag} ${latestTag}"
                                        sh "docker push ${latestTag}"
                                    }
                                }
                            }
                        }
                    }
                }
                stage('Ubuntu') {
                    agent {
                        node {
                            label 'yap-ubuntu-20-v1'
                        }
                    }
                    steps {
                        container('yap') {
                            unstash 'project'
                            sh 'apt-get update'
                            sh 'apt-get install -y ca-certificates curl gnupg'
                            sh 'mkdir -p /etc/apt/keyrings'
                            sh 'curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg'
                            sh 'echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list'
                            sh 'apt-get update'
                            sh 'apt-get install nodejs -y'
                            sh 'mkdir /tmp/project'
                            sh 'cp -r . /tmp/project'
                            script {
                                if (BRANCH_NAME == 'devel') {
                                    def timestamp = new Date().format('yyyyMMddHHmmss')
                                    sh "sudo yap build ubuntu /tmp/project -r ${timestamp}"
                                } else {
                                    sh 'sudo yap build ubuntu /tmp/project'
                                }
                            }
                            stash includes: 'artifacts/', name: 'artifacts-deb'
                        }
                    }
                    post {
                        always {
                            archiveArtifacts artifacts: 'artifacts/*.deb', fingerprint: true
                        }
                    }
                }
                stage('RHEL') {
                    agent {
                        node {
                            label 'yap-rocky-8-v1'
                        }
                    }
                    steps {
                        container('yap') {
                            unstash 'project'
                            sh 'curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -'
                            sh 'sudo yum install nodejs -y'
                            sh 'mkdir /tmp/project'
                            sh 'cp -r . /tmp/project'
                            script {
                                if (BRANCH_NAME == 'devel') {
                                    def timestamp = new Date().format('yyyyMMddHHmmss')
                                    sh "sudo yap build rocky /tmp/project -r ${timestamp}"
                                } else {
                                    sh 'sudo yap build rocky /tmp/project'
                                }
                            }
                            stash includes: 'artifacts/*.rpm', name: 'artifacts-rpm'
                        }
                    }
                    post {
                        always {
                            archiveArtifacts artifacts: 'artifacts/*.rpm', fingerprint: true
                        }
                    }
                }
            }
        }
        stage('Upload To Playground') {
            when {
                anyOf {
                    expression { params.PLAYGROUND == true }
                    allOf {
                      changeRequest()
                      expression { env.CHANGE_TARGET.startsWith('devel') }
                    }
                }
            }
            steps {
                unstash 'artifacts-deb'
                unstash 'artifacts-rpm'
                script {
                    def server = Artifactory.server 'zextras-artifactory'
                    def buildInfo
                    def uploadSpec
                    buildInfo = Artifactory.newBuildInfo()
                    uploadSpec = """{
                        "files": [
                            {
                                "pattern": "artifacts/*.deb",
                                "target": "ubuntu-playground/pool/",
                                "props": "deb.distribution=focal;deb.distribution=jammy;deb.distribution=noble;deb.component=main;deb.architecture=amd64;vcs.revision=${env.GIT_COMMIT}"
                            },
                            {
                                "pattern": "artifacts/(carbonio-storages-ce)-(*).x86_64.rpm",
                                "target": "centos8-playground/zextras/{1}/{1}-{2}.x86_64.rpm",
                                "props": "rpm.metadata.arch=x86_64;rpm.metadata.vendor=zextras;vcs.revision=${env.GIT_COMMIT}"
                            },
                            {
                                "pattern": "artifacts/(carbonio-storages-ce)-(*).x86_64.rpm",
                                "target": "rhel9-playground/zextras/{1}/{1}-{2}.x86_64.rpm",
                                "props": "rpm.metadata.arch=x86_64;rpm.metadata.vendor=zextras;vcs.revision=${env.GIT_COMMIT}"
                            }
                        ]
                    }"""
                    server.upload spec: uploadSpec, buildInfo: buildInfo, failNoOp: false
                }
            }
        }
        stage('Upload To Devel') {
            when {
              branch 'devel'
            }
            steps {
                unstash 'artifacts-deb'
                unstash 'artifacts-rpm'
                script {
                    def server = Artifactory.server 'zextras-artifactory'
                    def buildInfo
                    def uploadSpec
                    buildInfo = Artifactory.newBuildInfo()
                    uploadSpec = """{
                        "files": [
                            {
                                "pattern": "artifacts/*.deb",
                                "target": "ubuntu-devel/pool/",
                                "props": "deb.distribution=focal;deb.distribution=jammy;deb.distribution=noble;deb.component=main;deb.architecture=amd64;vcs.revision=${env.GIT_COMMIT}"
                            },
                            {
                                "pattern": "artifacts/(carbonio-storages-ce)-(*).x86_64.rpm",
                                "target": "centos8-devel/zextras/{1}/{1}-{2}.x86_64.rpm",
                                "props": "rpm.metadata.arch=x86_64;rpm.metadata.vendor=zextras;vcs.revision=${env.GIT_COMMIT}"
                            },
                            {
                                "pattern": "artifacts/(carbonio-storages-ce)-(*).x86_64.rpm",
                                "target": "rhel9-devel/zextras/{1}/{1}-{2}.x86_64.rpm",
                                "props": "rpm.metadata.arch=x86_64;rpm.metadata.vendor=zextras;vcs.revision=${env.GIT_COMMIT}"
                            }
                        ]
                    }"""
                    server.upload spec: uploadSpec, buildInfo: buildInfo, failNoOp: false
                }
            }
        }
        stage('Upload & Promotion Config') {
            when {
                buildingTag()
            }
            steps {
                unstash 'artifacts-deb'
                unstash 'artifacts-rpm'
                script {
                    def server = Artifactory.server 'zextras-artifactory'
                    def buildInfo
                    def uploadSpec
                    def config

                    //ubuntu
                    buildInfo = Artifactory.newBuildInfo()
                    buildInfo.name += "-ubuntu"
                    uploadSpec = """{
                        "files": [
                            {
                                "pattern": "artifacts/*.deb",
                                "target": "ubuntu-rc/pool/",
                                "props": "deb.distribution=focal;deb.distribution=jammy;deb.distribution=noble;deb.component=main;deb.architecture=amd64;vcs.revision=${env.GIT_COMMIT}"
                            }
                        ]
                    }"""
                    server.upload spec: uploadSpec, buildInfo: buildInfo, failNoOp: false
                    config = [
                            'buildName'          : buildInfo.name,
                            'buildNumber'        : buildInfo.number,
                            'sourceRepo'         : 'ubuntu-rc',
                            'targetRepo'         : 'ubuntu-release',
                            'comment'            : 'Do not change anything! Just press the button',
                            'status'             : 'Released',
                            'includeDependencies': false,
                            'copy'               : true,
                            'failFast'           : true
                    ]
                    Artifactory.addInteractivePromotion server: server, promotionConfig: config, displayName: "Ubuntu Promotion to Release"
                    server.publishBuildInfo buildInfo

                    //rhel8
                    buildInfo = Artifactory.newBuildInfo()
                    buildInfo.name += "-centos8"
                    uploadSpec= """{
                        "files": [
                            {
                                "pattern": "artifacts/(carbonio-storages-ce)-(*).x86_64.rpm",
                                "target": "centos8-rc/zextras/{1}/{1}-{2}.x86_64.rpm",
                                "props": "rpm.metadata.arch=x86_64;rpm.metadata.vendor=zextras;vcs.revision=${env.GIT_COMMIT}"
                            }
                        ]
                    }"""
                    server.upload spec: uploadSpec, buildInfo: buildInfo, failNoOp: false
                    config = [
                            'buildName'          : buildInfo.name,
                            'buildNumber'        : buildInfo.number,
                            'sourceRepo'         : 'centos8-rc',
                            'targetRepo'         : 'centos8-release',
                            'comment'            : 'Do not change anything! Just press the button',
                            'status'             : 'Released',
                            'includeDependencies': false,
                            'copy'               : true,
                            'failFast'           : true
                    ]
                    Artifactory.addInteractivePromotion server: server, promotionConfig: config, displayName: "RHEL8 Promotion to Release"
                    server.publishBuildInfo buildInfo

                    //rhel9
                    buildInfo = Artifactory.newBuildInfo()
                    buildInfo.name += "-rhel9"
                    uploadSpec= """{
                        "files": [
                            {
                                "pattern": "artifacts/(carbonio-storages-ce)-(*).x86_64.rpm",
                                "target": "rhel9-rc/zextras/{1}/{1}-{2}.x86_64.rpm",
                                "props": "rpm.metadata.arch=x86_64;rpm.metadata.vendor=zextras;vcs.revision=${env.GIT_COMMIT}"
                            }
                        ]
                    }"""
                    server.upload spec: uploadSpec, buildInfo: buildInfo, failNoOp: false
                    config = [
                            'buildName'          : buildInfo.name,
                            'buildNumber'        : buildInfo.number,
                            'sourceRepo'         : 'rhel9-rc',
                            'targetRepo'         : 'rhel9-release',
                            'comment'            : 'Do not change anything! Just press the button',
                            'status'             : 'Released',
                            'includeDependencies': false,
                            'copy'               : true,
                            'failFast'           : true
                    ]
                    Artifactory.addInteractivePromotion server: server, promotionConfig: config, displayName: "RHEL9 Promotion to Release"
                    server.publishBuildInfo buildInfo
                }
            }
        }
    }
}
