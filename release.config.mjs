/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * @type {import('semantic-release').GlobalConfig}
 */
export default {
  branches: ['main'],
  tagFormat: 'v${version}',
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        releaseRules: [
          { type: 'feat', release: 'minor' },
          { type: 'fix', release: 'patch' },
          { type: 'perf', release: 'patch' },
          { type: 'refactor', release: 'patch' },
          { type: 'build', release: 'patch' },
          { type: 'chore', scope: 'deps', release: 'patch' },
          { type: 'chore', scope: 'release', release: false },
          { type: 'chore', release: false },
          { type: 'ci', release: false },
          { type: 'docs', release: false },
          { type: 'style', release: false },
          { type: 'test', release: false },
          { breaking: true, release: 'major' }
        ]
      }
    ],
    [
      '@semantic-release/release-notes-generator',
      { preset: 'conventionalcommits' }
    ],
    [
      '@semantic-release/changelog',
      { changelogFile: 'CHANGELOG.md' }
    ],
    [
      '@semantic-release/npm',
      { npmPublish: false }
    ],
    [
      '@semantic-release/exec',
      {
        prepareCmd:
          "sed -i 's/^pkgver=.*/pkgver=\"${nextRelease.version}\"/' package/PKGBUILD"
      }
    ],
    [
      '@semantic-release/git',
      {
        assets: ['package.json', 'package/PKGBUILD', 'CHANGELOG.md'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
      }
    ],
    '@semantic-release/github'
  ]
};
