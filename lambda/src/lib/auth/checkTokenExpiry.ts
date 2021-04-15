import { DynamoDB } from 'aws-sdk'
import moment from 'moment'
import { TIMESTAMP_FORMAT } from '../constants/time'

const checkTokenExpiry = async (item: DynamoDB.AttributeMap) => {
  console.log('checking expiry', item.expiry.S)
  const valid = moment(item.expiry.S, TIMESTAMP_FORMAT).isAfter(moment())
  console.log({ expired: !valid  })
  return valid
}

export default checkTokenExpiry
