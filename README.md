# Instructions

## Setup

1. Create a new application in your auth0 tenant (Machine-to-Machine)
1. In the API's section, click on the management API
1. In the Machine-to-Machine section set the new application you created to be authorized for the `read:users` and `update:users` scopes
1. Create a file with a user ID per line in the file
1. Make sure you have downloaded and installed node version 8.9.x


## To Run

```
git clone git@github.com:/mostekcm/fixfacebookdates
cd fixfacebookdates
npm i
cp env.sample .env # NOTE: RATE_LIMIT should be 1 for dev and up to 25 for prod depending on how intrusive you want it to be
```
update the .env file to have the client ID and secret from the newly created application from setup.  Set the filename to match the filename that contains the user IDs.
```
node index.js
```

## IMPORTANT

Make sure you delete that application after you are done running the script