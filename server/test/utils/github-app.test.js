const crypto = require('crypto');
const { expect } = require('chai');

const { createAppJwt, createGithubApp } = require('../../utils/github-app');

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

  describe('#listBranches()', () => {
    const originalFetch = global.fetch;
    let branchPages;
    let branchesStatus;

    const respond = (status, body) => ({ status, json: async () => body });

    beforeEach(() => {
      branchPages = [];
      branchesStatus = 200;

      global.fetch = async (url) => {
        const { pathname, searchParams } = new URL(url);

        if (pathname === '/repos/octo/app/installation') {
          return respond(200, { id: 7 });
        }

        if (pathname === '/app/installations/7/access_tokens') {
          return respond(201, { token: 'token', expires_at: '2999-01-01T00:00:00Z' });
        }

        if (pathname === '/repos/octo/app/branches') {
          const page = Number(searchParams.get('page'));

          return respond(branchesStatus, branchPages[page - 1] || []);
        }

        return respond(404, null);
      };
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    const createApp = () =>
      createGithubApp({ appId: 1, privateKey, apiUrl: 'https://api.github.test' });

    it('collects branch names across pages', async () => {
      branchPages = [
        Array.from({ length: 100 }, (_, index) => ({ name: `branch-${index}` })),
        [{ name: 'main' }],
      ];

      const branches = await createApp().listBranches('octo/app');

      expect(branches).to.have.length(101);
      expect(branches[100]).to.equal('main');
    });

    it('fails with a GithubError when GitHub refuses', async () => {
      branchesStatus = 403;

      try {
        await createApp().listBranches('octo/app');
        expect.fail('should have thrown');
      } catch (error) {
        expect(error.name).to.equal('GithubError');
        expect(error.status).to.equal(403);
      }
    });
  });
});
