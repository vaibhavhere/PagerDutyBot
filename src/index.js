async function acknowledgeIncidents() {
  try {
    const headers = {
      Authorization: `Token token=${process.env.SECRETS.PAGERDUTY_API_KEY}`,
      'Content-Type': 'application/json',
    };
    console.log(process.env.SECRETS);
    console.log(process.env.VARS);
    console.log(process.env.VARS.RESOLVABLE_PAGERS);
    console.log(typeof(process.env.VARS.RESOLVABLE_PAGERS));
    const url = `https://api.pagerduty.com/incidents?statuses[]=triggered&user_ids[]=${process.env.VARS.PAGERDUTY_USER_ID}`;
    
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch incidents. Status: ${response.status}`);
    }

    const data = await response.json();
    const incidents = data.incidents;

    if (!incidents || incidents.length === 0) {
      console.log('No triggered incidents found for the user.');
      return;
    }

    console.log(`Found ${incidents.length} triggered incidents.`);
    
    const promises = incidents.map((incident) => {
      const incidentId = incident.id;
      const ackUrl = `https://api.pagerduty.com/incidents/${incidentId}`;
      const ackBody = JSON.stringify({
        incident: {
          type: 'incident_reference',
          status: process.env.VARS.RESOLVABLE_PAGERS.includes(incident.title) ? 'acknowledged':'resolved',
        },
      });

      return fetch(ackUrl, {
        method: 'PUT',
        headers,
        body: ackBody,
      }).then((ackResponse) => {
        if (ackResponse.ok) {
          console.log(`Acknowledged incident: ${incidentId}`);
        } else {
          console.error(`Failed to acknowledge incident: ${incidentId}. Status: ${ackResponse.status}`);
        }
      });
    });

    await Promise.all(promises);

    console.log('All incidents processed.');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

acknowledgeIncidents();