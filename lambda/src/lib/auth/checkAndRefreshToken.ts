import { DynamoDB } from 'aws-sdk'
import checkTokenExpiry from './checkTokenExpiry'
import refreshToken from './refreshToken'

const checkAndRefreshToken = async (existing: DynamoDB.QueryOutput) => {

  console.log('Got existing', JSON.stringify(existing.Items))

  if (existing.Items && existing.Items.length === 1) {
    const tokenItem = existing.Items[0]

    const valid = await checkTokenExpiry(tokenItem)
    if (valid) {
      await refreshToken(tokenItem)
      return true
    }
  }
  return false
}

export default checkAndRefreshToken
