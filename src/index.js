async function acknowledgeIncidents() {
  try {
    const headers = {
      Authorization: `Token token=${process.env.PAGERDUTY_API_KEY}`,
      'Content-Type': 'application/json',
    };
    const url = `https://api.pagerduty.com/incidents?statuses[]=triggered&user_ids[]=${process.env.PAGERDUTY_USER_ID}`;
    
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch incidents. Status: ${response.status}`);
    }

    const data = await response.json();
    const incidents = data.incidents;

    if (!incidents || incidents.length === 0) {
      return;
    }

    
    const promises = incidents.map((incident) => {
      const incidentId = incident.id;
      const url = `https://api.pagerduty.com/incidents/${incidentId}`;
      const body = JSON.stringify({
        incident: {
          type: 'incident_reference',
          status: 'resolved', //'acknowledged'
        },
      });

      return fetch(url, {
        method: 'PUT',
        headers,
        body: body,
      }).then((ackResponse) => {
        if (ackResponse.ok) {
        } else {
          console.error(`Failed to acknowledge incident: ${incidentId}. Status: ${ackResponse.status}`);
        }
      });
    });

    await Promise.all(promises);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

acknowledgeIncidents();