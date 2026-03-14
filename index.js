require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// * Please DO NOT INCLUDE the private app access token in your repo. Don't do this practicum in your normal account.
const PRIVATE_APP_ACCESS = process.env.PRIVATE_APP_ACCESS;
const OBJECT_TYPE_ID = process.env.OBJECT_TYPE_ID;

// TODO: ROUTE 1 - Create a new app.get route for the homepage to call your custom object data. Pass this data along to the front-end and create a new pug template in the views folder.

// * Code for Route 1 goes here
app.get('/', async (req, res) => { 
    const customObjects = `https://api.hubapi.com/crm/v3/objects/${OBJECT_TYPE_ID}?properties=monster_id,monster_name,classification,gender,striking_strength`;
    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    }
    try {
        const resp = await axios.get(customObjects, { headers });
        const data = resp.data.results;
        res.render('homepage', { title: 'Monsters | HubSpot CRM', data });      
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching data from HubSpot');
    }
});

// TODO: ROUTE 2 - Create a new app.get route for the form to create or update new custom object data. Send this data along in the next route.

// * Code for Route 2 goes here
app.get('/update-cobj', async (req, res) => {
    res.render('updates', { title: 'Update Custom Object Form | HubSpot' });
});


// TODO: ROUTE 3 - Create a new app.post route for the custom objects form to create or update your custom object data. Once executed, redirect the user to the homepage.

// * Code for Route 3 goes here
app.post('/update-cobj', async (req, res) => {
    const properties = {
        "monster_id": req.body.monster_id,
        "monster_name": req.body.monster_name,
        "classification": req.body.classification,
        "gender": req.body.gender,
        "striking_strength": req.body.striking_strength
    };

    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    };

    try { 
        // 1. Search for existing object by unique monster_id
        const searchUrl = `https://api.hubapi.com/crm/v3/objects/${OBJECT_TYPE_ID}/search`;
        const searchBody = {
            filterGroups: [{
                filters: [{
                    propertyName: 'monster_id',
                    operator: 'EQ',
                    value: req.body.monster_id
                }]
            }]
        };

        const searchResp = await axios.post(searchUrl, searchBody, { headers });
        
        if (searchResp.data.results.length > 0) {
            // 2a. Update existing object
            const objectId = searchResp.data.results[0].id;
            const updateUrl = `https://api.hubapi.com/crm/v3/objects/${OBJECT_TYPE_ID}/${objectId}`;
            await axios.patch(updateUrl, { properties }, { headers });
            console.log(`Updated monster ${req.body.monster_id}`);
        } else {
            // 2b. Create new object
            const createUrl = `https://api.hubapi.com/crm/v3/objects/${OBJECT_TYPE_ID}`;
            await axios.post(createUrl, { properties }, { headers });
            console.log(`Created new monster ${req.body.monster_id}`);
        }

        res.redirect('/');
    } catch(err) {
        console.error('Error processing HubSpot request:', err.response ? err.response.data : err.message);
        res.status(500).send('Error updating custom object');
    }
});



// * Localhost
app.listen(3000, () => console.log('Listening on http://localhost:3000'));