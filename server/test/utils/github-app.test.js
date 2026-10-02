const crypto = require('crypto');
const { expect } = require('chai');

const { createAppJwt } = require('../../utils/github-app');

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});

const decode = (part) => JSON.parse(Buffer.from(part, 'base64url').toString());

describe('github-app', () => {
  describe('#createAppJwt()', () => {
    const now = 1790000000;
    const jwt = createAppJwt(12345, privateKey, now);
    const [header, payload, signature] = jwt.split('.');

    it('is an RS256 JWT issued by the app', () => {
      expect(decode(header)).to.deep.equal({ alg: 'RS256', typ: 'JWT' });
      expect(decode(payload).iss).to.equal('12345');
    });

    it('is backdated for clock drift and expires within GitHub 10 minute limit', () => {
      const { iat, exp } = decode(payload);

      expect(iat).to.equal(now - 60);
      expect(exp).to.equal(now + 540);
      expect(exp - iat).to.be.at.most(600);
    });

    it('is signed with the private key', () => {
      const isValid = crypto
        .createVerify('RSA-SHA256')
        .update(`${header}.${payload}`)
        .verify(publicKey, Buffer.from(signature, 'base64url'));

      expect(isValid).to.equal(true);
    });
  });
});
