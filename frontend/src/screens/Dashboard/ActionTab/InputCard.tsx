import React from "react";
import SizedBox from "@components/SizedBox";
import { useDashboardVM } from "@screens/Dashboard/DashboardVm";
import Text from "@src/components/Text";
import { Row } from "@src/components/Flex";
import Button from "@components/Button";
import { observer } from "mobx-react-lite";
import TokenInput from "@components/TokenInput/TokenInput";
import BN from "@src/utils/BN";
import useCollapse from "@components/Collapse";
import SummaryCard from "@screens/Dashboard/SummaryCard";
import Card from "@src/components/Card";
import { useStores } from "@stores";
import Notification from "@components/Notification";

interface IProps {}

const InputCard: React.FC<IProps> = () => {
  const { accountStore } = useStores();
  const vm = useDashboardVM();
  const { getCollapseProps } = useCollapse({
    isExpanded: vm.action != null,
    duration: 500,
  });
  if (!accountStore.isLoggedIn) return null;

  const handleCancelClick = () => {
    vm.setAction(null);
    vm.setTokenAmount(null);
    vm.setActionTokenAssetId(null);
    vm.setPossibleBorrowRate(null);
    vm.setPossibleSupplyRate(null);
  };
  return (
    <div {...getCollapseProps()}>
      <Card>
        <Text fitContent weight={600} type="secondary" size="small">
          {vm.operationName} {vm.actionToken.symbol}
        </Text>
        <SizedBox height={16} />
        <TokenInput
          disabled={vm.loading}
          decimals={vm.actionToken.decimals}
          amount={vm.tokenAmount ?? BN.ZERO}
          setAmount={vm.setTokenAmount}
          assetId={vm.actionToken.assetId}
          onMaxClick={() => vm.onMaxBtnClick()}
          balance={vm.tokenInputBalance}
          error={vm.tokenInputError}
        />
        <SizedBox height={8} />
        {vm.loading ? (
          <Button disabled fixed>
            Loading...
          </Button>
        ) : (
          <Row>
            <Button kind="secondary" fixed onClick={handleCancelClick}>
              Cancel
            </Button>
            <SizedBox width={8} />
            <Button
              fixed
              onClick={vm.marketAction}
              disabled={!vm.marketActionMainBtnState}
            >
              {vm.operationName}
            </Button>
          </Row>
        )}
      </Card>
      {vm.notification != null && (
        <>
          <SizedBox height={16} />
          <Notification type="warning" text={vm.notification} />
        </>
      )}
      <SizedBox height={16} />
      <SummaryCard />
    </div>
  );
};
export default observer(InputCard);
