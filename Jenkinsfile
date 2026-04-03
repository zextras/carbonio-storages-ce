// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

library(
    identifier: 'jenkins-lib-common@1.3.4',
    retriever: modernSCM([
        $class: 'GitSCMSource',
        credentialsId: 'jenkins-integration-with-github-account',
        remote: 'git@github.com:zextras/jenkins-lib-common.git',
    ])
)

properties(defaultPipelineProperties())

boolean isBuildingTag() {
    return env.TAG_NAME ? true : false
}

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

    stages {
        stage('Setup') {
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
                        pnpm install --frozen-lockfile && pnpm run build && pnpm run test
                    '''
                }
            }
        }

        stage('Build and Publish Docker Image') {
            when {
                expression {
                    return isBuildingTag() || env.BRANCH_NAME == 'devel'
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
                                curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
                                yum install -y nodejs
                            '''
                        ]
                    ]
                ])
            }
        }

        stage('Upload artifacts') {
            tools {
                jfrog 'jfrog-cli'
            }
            steps {
                uploadStage(
                    packages: yapHelper.resolvePackageNames(),
                    rockySinglePkg: true,
                    ubuntuSinglePkg: true,
                )
            }
        }
    }
}
