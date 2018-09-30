import React, { Component, PropTypes } from 'react'
import CartItem from './cart-item'

class CartList extends Component {
  static propTypes = {
    awsLogin: PropTypes.shape({
      aws: PropTypes.shape({
        DynamoDB: PropTypes.shape({
          DocumentClient: PropTypes.func,
        }),
      }),
    }),
    cartList: PropTypes.arrayOf(React.PropTypes.object),
  }

  static defaultProps = {
    cartList: [],
    awsLogin: null,
  }

  constructor(props) {
    super(props)
    this.state = {}
    console.log(this.props)
  }

  render() {
    if (!this.props.cartList) {
      return null
    }

    return (
      <div>
        {
          this.props.cartList.map(cart => (
            <CartItem
              className="cartItem"
              productId={cart.productId}
              createdAt={cart.createdAt}
              updatedAt={cart.updatedAt}
              quantity={cart.quantity}
              key={cart.createdAt}
              awsLogin={this.props.awsLogin}
              userId={cart.userId}
            />
          ))
        }
      </div>
    )
  }
}

export default CartList
