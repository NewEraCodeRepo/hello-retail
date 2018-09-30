import React, { Component, PropTypes } from 'react'
import { Link } from 'react-router'
import config from '../../config'

class CartItem extends Component {
  static propTypes = {
    awsLogin: PropTypes.shape({
      aws: PropTypes.shape({
        DynamoDB: PropTypes.shape({
          DocumentClient: PropTypes.func,
        }),
      }),
      state: PropTypes.shape({
        profile: PropTypes.shape({
          id: PropTypes.string,
          name: PropTypes.string,
        }),
      }),
      makeApiRequest: PropTypes.func,
    }).isRequired,
    productId: PropTypes.string.isRequired,
    quantity: PropTypes.number.isRequired,
  };

  static defaultProps = {
    awsLogin: null,
  }

  constructor(props) {
    super(props)
    this.state = {}
    this.getProductsByIdAsync = this.getProductsByIdAsync.bind(this)
    this.getProductByIdFromDynamoAsync = this.getProductByIdFromDynamoAsync.bind(this)
    this.productsLoaded = this.productsLoaded.bind(this)
    this.componentDidMount = this.componentDidMount.bind(this)
    this.removeFromCart = this.removeFromCart.bind(this)
    this.state.errors = []
    this.state.removeMessage = null
  }

  componentDidMount() {
    this.dynamo = new this.props.awsLogin.aws.DynamoDB()
    this.docClient = new this.props.awsLogin.aws.DynamoDB.DocumentClient()

    if (this.props.productId) {
      return (this.getProductsByIdAsync(this.props.productId)
        .then(this.productsLoaded))
    } else {
      return Promise.reject(new Error('productId required'))
    }
  }


  getProductByIdFromDynamoAsync(productId) {
    const params = {
      AttributesToGet: [
        'brand',
        'description',
        'name',
        'id',
        'image',
      ],
      TableName: config.ProductCatalogTableName,
      Key: {
        id: { S: productId.toString() },
      },
    }
    return this.dynamo.getItem(params).promise()
  }

  getProductsByIdAsync(productId) {
    return this.getProductByIdFromDynamoAsync(productId)
      .then((data) => {
        const productList = []
        productList.push({
          brand: data.Item.brand.S,
          description: data.Item.description.S,
          name: data.Item.name.S,
          id: data.Item.id.S,
          image: data.Item.image ? data.Item.image.S : null,
        })
        return productList
      })
  }

  productsLoaded(products) {
    const p = products[0]
    this.setState({
      name: p.name,
      brand: p.brand,
      description: p.description,
      id: p.id,
      image: p.image ? `https://${p.image}` : null,
    })
  }

  removeFromCart() {
    this.props.awsLogin.makeApiRequest(config.EventWriterApi, 'POST', '/event-writer/', {
      schema: 'com.nordstrom/cart/remove/1-0-0',
      id: this.props.productId,
      origin: `hello-retail/web-client-cart-remove/${this.props.awsLogin.state.profile.id}/${this.props.awsLogin.state.profile.name}`,
    })
    .then(() => {
      this.setState({
        removeMessage: 'Deleted from cart.',
      })
    })
    .catch((error) => {
      console.log(error)
      this.setState({
        errors: [error],
      })
    })

    this.setState({
      removeMessage: 'Deleting from Cart ...',
    })
  }

  // TODO: Return cart items by last updatedAt timeout
  // TODO: Add total quantity of cart items near icon or at the top
  render() {
    let removeBlurb = null
    if (!this.state.removeMessage) {
      removeBlurb = <button onClick={this.removeFromCart}>Delete</button>
    } else {
      removeBlurb = <h4>{this.state.removeMessage}</h4>
    }

    return (
      <div>
        <h4>
          <Link
            className="cartItemLink"
            to={`/product/${encodeURIComponent(this.props.productId)}`}
          >
            {this.state.name}
          </Link>
        </h4>
        <div><em>{this.state.brand}</em></div>
        <div><b>Quantity:</b> {this.props.quantity}</div>
        <div>{this.state.description}</div>
        <div>
          { this.state.image ? (<img className="productImage" src={this.state.image} alt={this.state.name} />) : null }
        </div>
        <div>{removeBlurb}</div>
        <br />
      </div>
    )
  }
}

export default CartItem
