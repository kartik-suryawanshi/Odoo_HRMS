/**
 * File: backend/utils/smtpClient.js
 * Purpose: A custom, library-free SMTP client to send emails.
 * What it does: Connects to an SMTP server (like Gmail) over plain TCP, 
 *               upgrades to a secure TLS connection via STARTTLS, authenticates 
 *               using Base64 encoded credentials, and sends an email.
 * Data Fetching: N/A.
 * Data Sending: Sends SMTP commands over a socket to the email provider.
 * External Dependencies: net, tls (Node.js built-ins). No external NPM libs used.
 * Environment Variables Required: SMTP_HOST, SMTP_PORT, SMTP_EMAIL, SMTP_APP_PASSWORD.
 * Related Files: backend/controllers/authController.js
 */

const net = require('net');
const tls = require('tls');

class SMTPClient {
  constructor(host, port, email, password) {
    this.host = host;
    this.port = port;
    this.email = email;
    this.password = password;
  }

  /**
   * Helper to send an SMTP command and wait for the server's response
   */
  sendCommand(socket, command) {
    return new Promise((resolve) => {
      socket.write(command + '\r\n');
      socket.once('data', (data) => {
        // console.log("S:", data.toString()); // Uncomment for debugging
        resolve(data.toString());
      });
    });
  }

  /**
   * Main method to orchestrate the SMTP connection, authentication, and sending
   */
  async sendMail(to, subject, body) {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection(this.port, this.host);

      socket.on('error', (err) => {
        console.error('SMTP Socket Error:', err);
        reject(err);
      });

      // Wait for initial greeting from SMTP server
      socket.once('data', async (data) => {
        try {
          // Step 1: EHLO (Introduce client)
          await this.sendCommand(socket, 'EHLO localhost');

          // Step 2: STARTTLS (Request to upgrade to secure connection)
          await this.sendCommand(socket, 'STARTTLS');

          // Upgrade the existing socket to TLS
          const secureSocket = tls.connect({
            socket: socket,
            host: this.host,
          });

          secureSocket.on('error', (err) => {
            console.error('SMTP Secure Socket Error:', err);
            reject(err);
          });

          secureSocket.on('secureConnect', async () => {
            // Step 3: EHLO again over the secure connection
            await this.sendCommand(secureSocket, 'EHLO localhost');

            // Step 4: AUTH LOGIN (Authenticate)
            await this.sendCommand(secureSocket, 'AUTH LOGIN');
            await this.sendCommand(secureSocket, Buffer.from(this.email).toString('base64'));
            await this.sendCommand(secureSocket, Buffer.from(this.password).toString('base64'));

            // Step 5: MAIL FROM and RCPT TO (Set sender and recipient)
            await this.sendCommand(secureSocket, `MAIL FROM:<${this.email}>`);
            await this.sendCommand(secureSocket, `RCPT TO:<${to}>`);

            // Step 6: DATA (Start mail payload)
            await this.sendCommand(secureSocket, 'DATA');

            // Step 7: Email Content (Ends with a single dot on a new line)
            const message = `Subject: ${subject}\r\n\r\n${body}\r\n.`;
            await this.sendCommand(secureSocket, message);

            // Step 8: QUIT (Close connection gracefully)
            await this.sendCommand(secureSocket, 'QUIT');
            secureSocket.end();

            resolve(true);
          });
        } catch (error) {
          console.error('SMTP Protocol Error:', error);
          reject(error);
        }
      });
    });
  }
}

module.exports = SMTPClient;
