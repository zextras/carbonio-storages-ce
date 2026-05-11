// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

library(
    identifier: 'jenkins-lib-common@1.7.5',
    retriever: modernSCM([
        $class: 'GitSCMSource',
        credentialsId: 'jenkins-integration-with-github-account',
        remote: 'git@github.com:zextras/jenkins-lib-common.git',
    ])
)

properties(defaultPipelineProperties())

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
                gitMetadata()
            }
        }

        stage('Launch tests') {
            steps {
                container('nodejs-22') {
                    sh '''
                        corepack enable && corepack prepare pnpm@latest --activate
                        pnpm install --frozen-lockfile && pnpm run build && pnpm run test
                    '''
                }
            }
        }

        stage('Build and Publish Docker Image') {
            steps {
                script {
                    dockerStage(
                        imageName: 'carbonio-storages-ce',
                        ocLabels: [
                            title: 'Carbonio storages CE',
                            description: 'Carbonio storages CE',
                        ]
                    )
                }
            }
        }

        stage('Build deb/rpm') {
            steps {
                echo 'Building deb/rpm packages'
                buildStage([
                    rockySinglePkg: true,
                    ubuntuSinglePkg: true,
                    buildFlags: '-ds',
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
