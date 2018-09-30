import React, { Component, PropTypes } from 'react'
import { browserHistory } from 'react-router'
import ProductDataSource from './product-data-source'
import ValidationErrors from '../validation-errors'
import config from '../../config'

class ProductDetailPage extends Component {
  static propTypes = {
    awsLogin: PropTypes.shape({
      state: PropTypes.shape({
        profile: PropTypes.shape({
          id: PropTypes.string,
          name: PropTypes.string,
        }),
      }),
      makeApiRequest: PropTypes.func,
    }).isRequired,
    params: PropTypes.shape({
      id: PropTypes.string.isRequired,
    }).isRequired,
  }

  constructor(props) {
    super(props)
    this.state = {}
    this.productsLoaded = this.productsLoaded.bind(this)
    this.purchaseProduct = this.purchaseProduct.bind(this)
    this.addToCart = this.addToCart.bind(this)
    this.state.errors = []
    this.state.buyMessage = null
    this.state.addMessage = null
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

  purchaseProduct() {
    this.props.awsLogin.makeApiRequest(config.EventWriterApi, 'POST', '/event-writer/', {
      schema: 'com.nordstrom/product/purchase/1-0-0',
      id: this.props.params.id,
      origin: `hello-retail/web-client-purchase-product/${this.props.awsLogin.state.profile.id}/${this.props.awsLogin.state.profile.name}`,
    })
      .then(() => {
        // browserHistory.push('/categories/')
        this.setState({
          buyMessage: 'Order Placed.',
        })
      })
      .catch((error) => {
        // Show error message and re-enable button so user can try again.
        console.log(error)
        this.setState({
          errors: [error],
        })
      })

    this.setState({
      buyMessage: 'Please wait...',
    })
  }

  addToCart() {
    this.props.awsLogin.makeApiRequest(config.EventWriterApi, 'POST', '/event-writer/', {
      schema: 'com.nordstrom/cart/add/1-0-0',
      id: this.props.params.id,
      origin: `hello-retail/web-client-cart-product/${this.props.awsLogin.state.profile.id}/${this.props.awsLogin.state.profile.name}`,
    })
      .then(() => {
        this.setState({
          addMessage: 'Added to Cart.',
        })
      })
      .catch((error) => {
        console.log(error)
        this.setState({
          errors: [error],
        })
      })

    this.setState({
      addMessage: 'Adding to Cart ...',
    })
  }

  render() {
    // TODO: Add query for single product by id
    // TODO: Add image

    // let blurb = null
    // if (!this.state.buyMessage) {
    //   blurb = <button onClick={this.purchaseProduct}>Buy</button>
    // } else {
    //   blurb = <h4>{this.state.buyMessage}</h4>
    // }

    let cartBlurb = null
    if (!this.state.addMessage) {
      cartBlurb = <button onClick={this.addToCart}>Add to Cart</button>
    } else {
      cartBlurb = <h4>{this.state.addMessage}</h4>
    }

    const backButtonStyle = {
      margin: '15px',
    }

    console.log(this.state)
    return (
      <div>
        <div>
          <h3>{this.state.brand}</h3>
          <h4>{this.state.name}</h4>
          <div>{this.state.description}</div>
          <div>
            { this.state.image ? (<img className="productImage" src={this.state.image} alt={this.state.name} />) : null }
          </div>
          <br />
          <ValidationErrors errors={this.state.errors} />
          {cartBlurb}
          <ProductDataSource awsLogin={this.props.awsLogin} productId={this.props.params.id} productsLoaded={this.productsLoaded} />
          <button style={backButtonStyle} onClick={browserHistory.goBack}>Back to List</button>
        </div>
      </div>
    )
  }
}

export default ProductDetailPage
