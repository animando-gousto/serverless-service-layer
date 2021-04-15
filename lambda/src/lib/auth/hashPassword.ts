import crypto from 'crypto'

const hashPassword = (username: string, password: string) =>
  crypto.createHash('sha256').update(username).update(password).digest('base64')

export default hashPassword
