// SPDX-FileCopyrightText: 2022 2021 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import tap from "tap";
import {AWSV4SignatureAuth} from "../../node/auth/AWSV4SignatureAuth";
import {Config} from "../../node/config/configuration";
import {Auth} from "../../node/auth/Auth";
import {NoChecksAuth} from "../../node/auth/NoChecksAuth";
import {AuthFactory} from "../../node/auth/AuthFactory";

const testEnvironmentProviders: [string, Partial<Config>, (auth: Auth) => boolean][] = [
  [" with empty configuration", {}, (auth) => (auth instanceof NoChecksAuth) && !(auth instanceof AWSV4SignatureAuth) ],
  [" with empty awsv4signature", {awsv4signature: {}}, (auth) => (auth instanceof NoChecksAuth) && !(auth instanceof AWSV4SignatureAuth) ],
  [" with awsv4signature", {awsv4signature: {"key": "value"}}, (auth) => (auth instanceof AWSV4SignatureAuth) && !(auth instanceof NoChecksAuth) ],
]

for(const environmentProviderConfig of testEnvironmentProviders) {
  const [description, configuration, typeVerifier] = environmentProviderConfig

  tap.test(`check auth creation from config ${description}`, async t => {
    t.equal(typeVerifier(AuthFactory.create(configuration)), true)
  })
}