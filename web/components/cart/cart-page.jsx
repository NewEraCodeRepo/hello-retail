import React, { Component, PropTypes } from 'react'
import CartList from './cart-list'
import CartDataSource from './cart-data-source'

class CartPage extends Component {
  // TODO: DRY up all these duplicate propType declarations everywhere
  static propTypes = {
    awsLogin: PropTypes.shape({
      state: PropTypes.shape({
        profile: PropTypes.shape({
          id: PropTypes.string,
          name: PropTypes.string,
        }),
      }),
      makeApiRequest: PropTypes.func,
    }),
  }

  static defaultProps = {
    awsLogin: null,
  }

  constructor(props) {
    super(props)
    this.state = {}
    console.log(this.props)
    this.cartItemsLoaded = this.cartItemsLoaded.bind(this)
  }

  cartItemsLoaded(cartItems) {
    this.setState({
      cartItemsList: cartItems,
    })
  }

  render() {
    return (
      <div>
        <h3 className="cartTitle"><em>Shopping Cart</em></h3>
        <CartList className="cartList" userId={this.props.awsLogin.state.profile.id.slice(14)} cartList={this.state.cartItemsList} awsLogin={this.props.awsLogin} />
        <CartDataSource awsLogin={this.props.awsLogin} userId={this.props.awsLogin.state.profile.id.slice(14)} cartItemsLoaded={this.cartItemsLoaded} />
      </div>
    )
  }
}

export default CartPage
