'use strict'

const AJV = require('ajv')
const aws = require('aws-sdk') // eslint-disable-line import/no-unresolved, import/no-extraneous-dependencies

const productsRequestSchema = require('./products-request-schema.json')
const productItemsSchema = require('./product-items-schema.json')

const makeSchemaId = schema => `${schema.self.vendor}/${schema.self.name}/${schema.self.version}`

const productsRequestSchemaId = makeSchemaId(productsRequestSchema)
const productItemsSchemaId = makeSchemaId(productItemsSchema)

const ajv = new AJV()
ajv.addSchema(productsRequestSchema, productsRequestSchemaId)
ajv.addSchema(productItemsSchema, productItemsSchemaId)

const dynamo = new aws.DynamoDB.DocumentClient()

const constants = {
  // self
  MODULE: 'cart/cartApi.js',
  METHOD_PRODUCTS: 'products',
  TABLE_CART_NAME: process.env.TABLE_CART_NAME,
  INVALID_REQUEST: 'Invalid Request',
  INTEGRATION_ERROR: 'Integration Error',
  HASHES: '##########################################################################################',
  SECURITY_RISK: '!!!SECURITY RISK!!!',
  DATA_CORRUPTION: 'DATA CORRUPTION',
}

const impl = {
  response: (statusCode, body) => ({
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*', // Required for CORS support to work
      'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
    },
    body,
  }),
  clientError: (schemaId, ajvErrors, event) => impl.response(
    400,
    `${constants.METHOD_PRODUCTS} ${constants.INVALID_REQUEST} could not validate request to '${schemaId}' schema. Errors: '${ajvErrors}' found in event: '${JSON.stringify(event)}'` // eslint-disable-line comma-dangle
  ),
  dynamoError: (err) => {
    console.log(err)
    return impl.response(500, `${constants.METHOD_PRODUCTS} - ${constants.INTEGRATION_ERROR}`)
  },
  securityRisk: (schemaId, ajvErrors, items) => {
    console.log(constants.HASHES)
    console.log(constants.SECURITY_RISK)
    console.log(`${constants.METHOD_PRODUCTS} ${constants.DATA_CORRUPTION} could not validate data to '${schemaId}' schema. Errors: ${ajvErrors}`)
    console.log(`${constants.METHOD_PRODUCTS} ${constants.DATA_CORRUPTION} bad data: ${JSON.stringify(items)}`)
    console.log(constants.HASHES)
    return impl.response(500, `${constants.METHOD_PRODUCTS} - ${constants.INTEGRATION_ERROR}`)
  },
  success: items => impl.response(200, JSON.stringify(items)),
}
const api = {
  // TODO deal with pagination
  categories: (event, context, callback) => {
    if (!ajv.validate(productsRequestSchemaId, event)) { // bad request
      callback(null, impl.clientError(productsRequestSchemaId, ajv.errorsText()), event)
    } else {
      const params = {
        TableName: constants.TABLE_CART_NAME,
        AttributesToGet: ['userId'],
      }
      dynamo.scan(params, (err, data) => {
        if (err) { // error from dynamo
          callback(null, impl.dynamoError(err))
        } else if (!ajv.validate(productItemsSchemaId, data.Items)) { // bad data in dynamo
          callback(null, impl.securityRisk(productItemsSchemaId, ajv.errorsText()), data.Items) // careful if the data is sensitive
        } else { // valid
          callback(null, impl.success(data.Items))
        }
      })
    }
  },
  // TODO this is only filter/query impl, also handle single item request
  // TODO deal with pagination
  products: (event, context, callback) => {
    if (!ajv.validate(productsRequestSchemaId, event)) { // bad request
      callback(null, impl.clientError(productsRequestSchemaId, ajv.errorsText(), event))
    } else {
      const params = {
        TableName: constants.TABLE_CART_NAME,
        IndexName: 'userId',
        ProjectionExpression: '#p, #c, #q, #up',
        KeyConditionExpression: '#u = :u',
        ExpressionAttributeNames: {
          '#u': 'userId',
          '#p': 'productId'
          '#c': 'createdAt',
          '#q': 'quantity',
          '#up': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':u': event.queryStringParameters.userId,
        },
      }
      dynamo.query(params, (err, data) => {
        if (err) { // error from dynamo
          callback(null, impl.dynamoError(err))
        } else if (!ajv.validate(productItemsSchemaId, data.Items)) { // bad data in dynamo
          callback(null, impl.securityRisk(productItemsSchemaId, ajv.errorsText()), data.Items) // careful if the data is sensitive
        } else { // valid
          callback(null, impl.success(data.Items))
        }
      })
    }
  },
}

module.exports = {
  products: api.products,
}
