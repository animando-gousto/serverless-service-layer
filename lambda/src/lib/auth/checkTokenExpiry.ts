import { DynamoDB } from 'aws-sdk'
import moment from 'moment'

const checkTokenExpiry = async (item: DynamoDB.AttributeMap) => moment(item.expiry.S).isAfter(moment())

export default checkTokenExpiry
