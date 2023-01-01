use crate::utils::{local_tests_utils::market, number_utils::parse_units};

#[tokio::test]
async fn get_oracle_price() {
    let (_admin, assets, market, oracle) = market::setup_market().await;

    let market_methods = market.methods();
    let oracle_methods = oracle.methods();

    let asset_id = assets.get("USDC").unwrap().asset_id;
    let price = parse_units(1, 9);

    let res = oracle_methods.set_price(asset_id, price).call().await;
    res.expect("❌ Cannou update oracle price");

    let res = oracle_methods.get_price(asset_id).simulate().await;
    res.as_ref().expect("❌ Cannou get oracle price");
    let oracle_price = res.unwrap().value.price;

    let res = market_methods.get_oracle_price(asset_id).simulate().await;
    // res.as_ref().expect("❌ Cannou get market oracle price");
    let market_oracle_price = res.unwrap().value;

    assert_eq!(market_oracle_price, oracle_price);
}
