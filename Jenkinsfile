// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

def nodeCmd(String cmd) {
	sh '. load_nvm && nvm install && nvm use && ' + cmd
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
            label 'base-agent-v1'
        }
    }
    stages {
        stage('Fetch sources') {
            agent {
                node {
                    label 'base-agent-v1'
                }
            }
            steps {
                checkout scm
                stash includes: '**', name: 'project'
            }
        }
        stage('Launch tests') {
            agent {
                node {
                    label 'nodejs-agent-v2'
                }
            }
            steps {
                unstash 'project'
                nodeCmd 'npm install && npm run build && npm run test'
            }
        }
        stage('Packaging...') {
            parallel {
                stage('Ubuntu 18.04') {
                    agent {
                        node {
                            label 'pacur-agent-ubuntu-18.04-v1'
                        }
                    }
                    steps {
                        unstash 'project'
                        sh 'curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -'
                        sh 'sudo apt-get install -y nodejs'
                        sh 'mkdir /tmp/project'
                        sh 'cp -r . /tmp/project'
                        sh 'sudo pacur build ubuntu-bionic /tmp/project'
                        stash includes: 'artifacts/', name: 'artifacts-ubuntu-bionic'
                    }
                    post {
                        always {
                            archiveArtifacts artifacts: 'artifacts/*.deb', fingerprint: true
                        }
                    }
                }
                stage('Centos 8') {
                    agent {
                        node {
                            label 'pacur-agent-centos-8-v1'
                        }
                    }
                    steps {
                        unstash 'project'
                        sh 'curl -fsSL https://rpm.nodesource.com/setup_14.x | sudo bash -'
                        sh 'sudo dnf install -y nodejs'
                        sh 'mkdir /tmp/project'
                        sh 'cp -r . /tmp/project'
                        sh 'sudo pacur build centos /tmp/project'
                        stash includes: 'artifacts/', name: 'artifacts-centos-8'
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
                }
            }
            steps {
                unstash 'artifacts-ubuntu-bionic'
                unstash 'artifacts-centos-8'
                script {
                    def server = Artifactory.server 'zextras-artifactory'
                    def buildInfo
                    def uploadSpec
                    buildInfo = Artifactory.newBuildInfo()
                    uploadSpec = '''{
                        "files": [
                            {
                                "pattern": "artifacts/*bionic*.deb",
                                "target": "ubuntu-playground/pool/",
                                "props": "deb.distribution=bionic;deb.component=main;deb.architecture=amd64"
                            },
                            {
                                "pattern": "artifacts/(carbonio-slimstore)-(*).rpm",
                                "target": "centos8-playground/zextras/{1}/{1}-{2}.rpm",
                                "props": "rpm.metadata.arch=x86_64;rpm.metadata.vendor=zextras"
                            }
                        ]
                    }'''
                    server.upload spec: uploadSpec, buildInfo: buildInfo, failNoOp: false
                }
            }
        }
        stage('Upload & Promotion Config') {
            when {
                buildingTag()
            }
            steps {
                unstash 'artifacts-ubuntu-bionic'
                unstash 'artifacts-centos-8'
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
                                "pattern": "artifacts/*bionic*.deb",
                                "target": "ubuntu-rc/pool/",
                                "props": "deb.distribution=bionic;deb.component=main;deb.architecture=amd64"
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


                    //centos8
                    buildInfo = Artifactory.newBuildInfo()
                    buildInfo.name += "-centos8"
                    uploadSpec= """{
                        "files": [
                            {
                                "pattern": "artifacts/(carbonio-slimstore)-(*).rpm",
                                "target": "centos8-rc/zextras/{1}/{1}-{2}.rpm",
                                "props": "rpm.metadata.arch=x86_64;rpm.metadata.vendor=zextras"
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
                    Artifactory.addInteractivePromotion server: server, promotionConfig: config, displayName: "Centos8 Promotion to Release"
                    server.publishBuildInfo buildInfo
                }
            }
        }
    }
}

