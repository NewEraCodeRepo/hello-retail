import { Component, PropTypes } from 'react'
import config from '../../config'

class CartDataSource extends Component {
  static propTypes = {
    awsLogin: PropTypes.shape({
      aws: PropTypes.shape({
        DynamoDB: PropTypes.shape({
          DocumentClient: PropTypes.func,
        }),
      }),
    }),
    cartItemsLoaded: PropTypes.func.isRequired,
    userId: PropTypes.string,
  }

  static defaultProps = {
    awsLogin: null,
    userId: null,
  }

  constructor(props) {
    super(props)
    this.getCartProductsByUserIdAsync = this.getCartProductsByUserIdAsync.bind(this)
    this.getCartProductsByUserIdFromDynamoAsync = this.getCartProductsByUserIdFromDynamoAsync.bind(this)
    this.componentDidMount = this.componentDidMount.bind(this)
  }

  componentDidMount() {
    this.dynamo = new this.props.awsLogin.aws.DynamoDB()
    this.docClient = new this.props.awsLogin.aws.DynamoDB.DocumentClient()

    if (this.props.userId) {
      return (this.getCartProductsByUserIdAsync(this.props.userId)
        .then(this.props.cartItemsLoaded))
    } else {
      return Promise.reject(new Error('userId required'))
    }
  }

  getCartProductsByUserIdFromDynamoAsync(userId) {
    const params = {
      TableName: config.CartTableName,
      KeyConditionExpression: '#ui = :ui',
      ExpressionAttributeNames: {
        '#ui': 'userId',
      },
      ExpressionAttributeValues: {
        ':ui': userId,
      },
    }
    return this.docClient.query(params).promise()
  }

  getCartProductsByUserIdAsync(userId) {
    return this.getCartProductsByUserIdFromDynamoAsync(userId)
    .then((data) => {
      const cartProductList = []

      data.Items.forEach((item) => {
        cartProductList.push({
          productId: item.productId,
          createdAt: item.createdAt,
          quantity: item.quantity,
          updatedAt: item.updatedAt,
          friendlyName: item.friendlyName,
          userId: item.userId,
        })
      })
      return cartProductList
    })
  }

  render() {
    return null
  }
}

export default CartDataSource
