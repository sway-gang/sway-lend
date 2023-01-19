import React, { PropsWithChildren, useMemo } from "react";
import { makeAutoObservable } from "mobx";
import { RootStore, useStores } from "@stores";
import { useVM } from "@src/hooks/useVM";
import {
  CONTRACT_ADDRESSES,
  IToken,
  NODE_URL,
  TOKENS_BY_ASSET_ID,
  TOKENS_BY_SYMBOL,
} from "@src/constants";
import BN from "@src/utils/BN";
import { MarketAbi, MarketAbi__factory } from "@src/contracts";
import { Provider, Wallet } from "fuels";

const ctx = React.createContext<DashboardVm | null>(null);

export enum ACTION_TYPE {
  SUPPLY,
  BORROW,
  REPAY,
  WITHDRAW,
}

export const DashboardVMProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const rootStore = useStores();
  const store = useMemo(() => new DashboardVm(rootStore), [rootStore]);
  return <ctx.Provider value={store}>{children}</ctx.Provider>;
};

export const useDashboardVM = () => useVM(ctx);

// export type TAction = "supply" | "borrow" | "repay" | "withdraw";

class DashboardVm {
  public rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  loading: boolean = false;
  private _setLoading = (l: boolean) => (this.loading = l);

  initMarketContract = async () => {
    const { address } = this.rootStore.accountStore;
    if (address == null) return;
    const wallet = Wallet.fromAddress(address, new Provider(NODE_URL));
    const tokenContract = MarketAbi__factory.connect(
      CONTRACT_ADDRESSES.market,
      wallet
    );
    this.setMarketContract(tokenContract);
  };

  collaterals: IToken[] = [
    TOKENS_BY_SYMBOL.SWAY,
    TOKENS_BY_SYMBOL.ETH,
    TOKENS_BY_SYMBOL.BTC,
    TOKENS_BY_SYMBOL.LINK,
    TOKENS_BY_SYMBOL.UNI,
  ];

  marketContract: MarketAbi | null = null;
  setMarketContract = (v: MarketAbi | null) => (this.marketContract = v);

  mode: 0 | 1 = 0;
  setMode = (v: 0 | 1) => (this.mode = v);

  action: ACTION_TYPE | null = null;
  setAction = (l: ACTION_TYPE | null) => (this.action = l);

  tokenAmount: BN | null = null;
  setTokenAmount = (l: BN | null) => (this.tokenAmount = l);

  actionTokenAssetId: string | null = null;
  setActionTokenAssetId = (l: string | null) => (this.actionTokenAssetId = l);

  isThereUserData = false;

  get tokenBtnsClick(): Record<string, [() => void]> {
    return this.collaterals.reduce((acc, v) => {
      const c = () => {
        console.log("click click", v.symbol);
      };
      return { ...acc, [v.assetId]: [c] };
    }, {} as Record<string, [() => void]>);
  }

  get token() {
    if (this.actionTokenAssetId == null) return TOKENS_BY_SYMBOL.USDC;
    return TOKENS_BY_ASSET_ID[this.actionTokenAssetId];
  }

  get baseToken() {
    return TOKENS_BY_SYMBOL.USDC;
  }

  supplyBase = async () => {
    console.log("supplyBase");
    this._setLoading(true);
    if (
      // this.marketContract == null ||
      this.action !== ACTION_TYPE.SUPPLY ||
      this.tokenAmount == null ||
      this.tokenAmount.lte(0)
    )
      return;

    const { address } = this.rootStore.accountStore;
    if (address == null || window?.fuel == null) return;

    const wallet = Wallet.fromAddress(address, window.fuel?.getProvider());
    const market = MarketAbi__factory.connect(
      CONTRACT_ADDRESSES.market,
      wallet
    );

    const value = await market.functions
      .supply_base()
      .callParams({
        forward: [this.tokenAmount.toString(), this.baseToken.assetId],
      })
      .txParams({})
      .call();
    this._setLoading(false);
    console.log(value);
  };

  onMaxBtnClick() {
    if (
      this.action === ACTION_TYPE.SUPPLY &&
      this.actionTokenAssetId === this.baseToken.assetId
    ) {
      const baseTokenAmount = this.rootStore.accountStore.findBalanceByAssetId(
        this.baseToken.assetId
      );
      this.setTokenAmount(baseTokenAmount?.balance ?? BN.ZERO);
    }
    // return () => void
  }

  get tokenInputBalance(): string {
    if (
      this.action === ACTION_TYPE.SUPPLY &&
      this.actionTokenAssetId === this.baseToken.assetId
    ) {
      return (
        this.rootStore.accountStore.getFormattedBalance(this.baseToken) ??
        "0.00"
      );
    }
    return "";
  }

  marketAction = () => {
    if (
      this.action === ACTION_TYPE.SUPPLY &&
      this.actionTokenAssetId === this.baseToken.assetId
    ) {
      return this.supplyBase();
    }
  };

  get operationName() {
    switch (this.action) {
      case ACTION_TYPE.SUPPLY:
        return "Supply";
      case ACTION_TYPE.BORROW:
        return "Borrow";
      case ACTION_TYPE.REPAY:
        return "Repay";
      case ACTION_TYPE.WITHDRAW:
        return "Withdraw";
    }
    return "";
  }
}
