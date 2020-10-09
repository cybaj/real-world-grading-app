import Hapi from '@hapi/hapi'
import Joi from '@hapi/joi'
import Boom from '@hapi/boom'
import { NodeMailgun } from 'ts-mailgun'

const mailer = new NodeMailgun()

// Module augmentation to add shared application state
// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/33809#issuecomment-472103564
declare module '@hapi/hapi' {
  interface ServerApplicationState {
    sendEmailToken(email: string, token: string): Promise<void>
  }
}

const emailPlugin = {
  name: 'app/email',
  register: async function (server: Hapi.Server) {
    if (!process.env.MAILGUN_API_KEY) {
      server.log(
        'warn',
        `The MAILGUN_API_KEY env var must be set, otherwise the API won't be able to send emails. Using debug mode which logs the email tokens instead.`,
      )
      server.app.sendEmailToken = debugSendEmailToken
    } else {
      mailer.apiKey = process.env.MAILGUN_API_KEY
      mailer.domain = process.env.MAILGUN_DOMAIN ?? ''
      mailer.fromEmail = "bowerco.tester@gmail.com"
      mailer.fromTitle = "bowerco auth mail"
      mailer.init()
      console.log(mailer)

      server.app.sendEmailToken = sendEmailToken
    }
  },
}

export default emailPlugin

async function sendEmailToken(email: string, token: string) {
  const msg = {
    to: email,
    subject: 'Login token for the modern backend API',
    text: `The login token for the API is: ${token}`,
  }

  await mailer.send(msg.to, msg.subject, msg.text)
    .then((result) => console.log('Mail Sending Done', result))
    .catch((error) => console.error('Mail Sending Error: ', error));

}

async function debugSendEmailToken(email: string, token: string) {
  console.log(`email token for ${email}: ${token} `)
}
