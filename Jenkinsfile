// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

library(
    identifier: 'jenkins-lib-common@v2.10.0',
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
                        ],
                        platforms: ['linux/amd64', 'linux/arm64'] as Set,
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
                    prepareFlags: '--repo \'name=nodesource,url=https://deb.nodesource.com/node_20.x,suite=nodistro,components=main,distros=ubuntu\' --repo \'name=nodesource,url=https://rpm.nodesource.com/pub_20.x/nodistro/nodejs/x86_64,format=rpm,distros=rocky\'',
                    buildFlags: '--repo \'name=nodesource,url=https://deb.nodesource.com/node_20.x,suite=nodistro,components=main,distros=ubuntu\' --repo \'name=nodesource,url=https://rpm.nodesource.com/pub_20.x/nodistro/nodejs/x86_64,format=rpm,distros=rocky\'',
                ])
            }
        }

        stage('Upload artifacts') {
            tools {
                jfrog 'jfrog-cli'
            }
            steps {
                uploadStage(
                    rockySinglePkg: true,
                    ubuntuSinglePkg: true,
                )
            }
        }
    }
}
