import nconf from 'nconf';
import dotenv from 'dotenv';
import { AuthenticationClient, ManagementClient } from 'auth0';
import fs from 'fs';
import moment from 'moment';
import Promise from 'bluebird';
import PromiseThrottle from 'promise-throttle';
import _ from 'lodash';

dotenv.config();

nconf
  .argv()
  .env()
  .defaults({
    BIRTHDAY_FIELD: 'birthday'
  });

const domain = nconf.get('AUTH0_DOMAIN');
const clientId = nconf.get('AUTH0_CLIENT_ID');
const clientSecret = nconf.get('AUTH0_CLIENT_SECRET');
const fileName = nconf.get('USERS_FILE');
const birthdayField = nconf.get('BIRTHDAY_FIELD');
const rateLimit = nconf.get('RATE_LIMIT');

const promiseThrottle = new PromiseThrottle({
  requestsPerSecond: rateLimit,           // up to 1 request per second
  promiseImplementation: Promise  // the Promise library you are using
});

console.log(`Running with clientId (${clientId}), secret (${clientSecret.substr(0, 5)}...).  Reading users from ${fileName}`);

const userIds = fs.readFileSync(fileName).toString().split("\n");

// create Auth0 management API client
const authClient = new AuthenticationClient({
  domain,
  clientId,
  clientSecret
});

const translateBirthday = facebookDate => moment(facebookDate, "MM/DD/YYYY").format('DD-MM-YYYY');

let updates = 0;

const updateUser = (userId, mgmtClient) =>
  mgmtClient.users.get({ id: userId })
    .then((user) => {
      // Create new value in user_metadata
      const birthday = _.get(user, birthdayField);
      if (birthday) {
        const user_metadata = { age: translateBirthday(birthday) };
        if (user_metadata.age !== user.user_metadata.age) {
          // Patch user_metadata
          return mgmtClient.users.update({ id: userId }, { user_metadata })
            .then(() => updates++);
        }

        console.log(`Skipped updating age for ${user.email} because it was already correct`);
        return null;
      }
    });

authClient.clientCredentialsGrant({ audience: `https://${domain}/api/v2/` })
  .then((tokenResult) => {
    const mgmtClient = new ManagementClient({
      domain,
      token: tokenResult.access_token
    });

    const promises = [];

    // for each user ID
    userIds.forEach((userId) => {
      if (userId.length > 0) {
        userId = userId.trim();
        // Pull user from Auth0
        promises.push(promiseThrottle.add(updateUser.bind(this, userId, mgmtClient)));
      }
    });

    Promise.all(promises)
      .then(() => console.log(`Updated ${updates} user${updates === 1 ? "" : "s"}`));
  })
  .catch(console.error);

