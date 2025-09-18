// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

library(
    identifier: 'jenkins-packages-build-library@1.0.4',
    retriever: modernSCM([
        $class: 'GitSCMSource',
        remote: 'git@github.com:zextras/jenkins-packages-build-library.git',
        credentialsId: 'jenkins-integration-with-github-account'
    ])
)

pipeline {
    agent {
        node {
            label 'nodejs-v1'
        }
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '5'))
        skipDefaultCheckout()
        timeout(time: 3, unit: 'HOURS')
    }

    parameters {
        booleanParam defaultValue: false,
            description: 'Whether to upload the packages in playground repositories',
            name: 'PLAYGROUND'
    }

    tools {
        jfrog 'jfrog-cli'
    }

    stages {
        stage('Fetch sources') {
            steps {
                checkout scm
                script {
                    gitMetadata()
                }
            }
        }

        stage('Launch tests') {
            steps {
                container('nodejs-22') {
                    sh '''
                        npm ci && npm run build && npm run test
                    '''
                }
            }
        }

        stage('Build and Publish Docker Image') {
            when {
                not {
                    anyOf {
                        buildingTag()
                        expression { env.BRANCH_NAME.startsWith("PR-") }
                    }
                }
            }
            steps {
                container('dind') {
                    withDockerRegistry([
                        credentialsId: 'private-registry',
                        url: 'https://registry.dev.zextras.com'
                    ]) {
                        script {
                            String branchTag = env.BRANCH_NAME.replaceAll('/', '-').toLowerCase()
                            Set<String> imageTags = [ branchTag ]

                            if (env.BRANCH_NAME == 'devel') {
                                imageTags.add('latest')
                            } else if (buildingTag() && env.TAG_NAME?.trim()) {
                                imageTags.add(env.TAG_NAME?.startsWith('v') ? env.TAG_NAME.substring(1) : env.TAG_NAME)
                            }

                            dockerHelper.buildImage([
                                imageName: 'registry.dev.zextras.com/dev/carbonio-storages-ce',
                                imageTags: imageTags,
                                ocLabels: [
                                    title: 'Carbonio storages CE',
                                    description: 'Carbonio storages CE',
                                    version: branchTag
                                ]
                            ])
                        }
                    }
                }
            }
        }

        stage('Build deb/rpm') {
            steps {
                echo 'Building deb/rpm packages'
                buildStage([
                    rockySinglePkg: true,
                    ubuntuSinglePkg: true,
                    overrides: [
                        'ubuntu': [
                            preBuildScript: '''
                                apt-get update
                                apt-get install -y ca-certificates curl gnupg
                                mkdir -p /etc/apt/keyrings
                                curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
                                    | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
                                echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" \
                                    | sudo tee /etc/apt/sources.list.d/nodesource.list
                                apt-get update
                                apt-get install -y nodejs
                            '''
                        ],
                        'rocky': [
                            preBuildScript: '''
                                yum install https://rpm.nodesource.com/pub_16.x/nodistro/repo/nodesource-release-nodistro-1.noarch.rpm -y
                                yum install nodejs -y --setopt=nodesource-nodejs.module_hotfixes=1
                            '''
                        ]
                    ]
                ])
            }
        }

        stage('Upload artifacts') {
            steps {
                uploadStage(
                    packages: yapHelper.getPackageNames(),
                    rockySinglePkg: true,
                    ubuntuSinglePkg: true,
                )
            }
        }
    }
}
