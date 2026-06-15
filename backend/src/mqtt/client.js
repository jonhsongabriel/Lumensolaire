const mqtt = require('mqtt');
const { pool } = require('../db/connection');

const MQTT_URL = process.env.MQTT_URL || 'mqtt://broker.hivemq.com:1883';
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'centrale/+/data';

let client = null;

function startMqttClient() {
  console.log(`Connecting to MQTT broker: ${MQTT_URL}`);
  console.log(`Subscribing to topic: ${MQTT_TOPIC}`);

  client = mqtt.connect(MQTT_URL);

  client.on('connect', () => {
    console.log('MQTT connected');
    client.subscribe(MQTT_TOPIC, (err) => {
      if (err) {
        console.error('MQTT subscription error:', err);
      } else {
        console.log(`MQTT subscribed to ${MQTT_TOPIC}`);
      }
    });
  });

  client.on('message', async (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());
      console.log(`MQTT message on ${topic}:`, payload);

      // Extract site identifier from topic: centrale/{site_id}/data
      const topicParts = topic.split('/');
      const siteIdentifier = topicParts[1];

      // Find site by serial_number or id
      let siteResult = await pool.query(
        'SELECT id FROM sites WHERE serial_number = $1 OR id = $1',
        [siteIdentifier]
      );

      if (siteResult.rows.length === 0) {
        console.warn(`Site not found for identifier: ${siteIdentifier}`);
        return;
      }

      const siteId = siteResult.rows[0].id;

      // Insert monitoring data
      await pool.query(
        `INSERT INTO monitoring_data 
         (site_id, production_kw, consumption_kw, battery_level_percent,
          battery_voltage, temperature_celsius, grid_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          siteId,
          payload.production_kw || null,
          payload.consumption_kw || null,
          payload.battery_level_percent || null,
          payload.battery_voltage || null,
          payload.temperature_celsius || null,
          payload.grid_status || null,
        ]
      );

      // Update site last_communication and status
      await pool.query(
        `UPDATE sites 
         SET last_communication = NOW(),
             scada_connection_status = 'connected',
             scada_last_connected = NOW(),
             status = 'operational'
         WHERE id = $1`,
        [siteId]
      );

      console.log(`Data saved for site ${siteId}`);
    } catch (error) {
      console.error('MQTT message processing error:', error);
    }
  });

  client.on('error', (err) => {
    console.error('MQTT error:', err);
  });

  client.on('disconnect', () => {
    console.log('MQTT disconnected');
  });
}

function stopMqttClient() {
  if (client) {
    client.end();
    client = null;
  }
}

module.exports = { startMqttClient, stopMqttClient };
