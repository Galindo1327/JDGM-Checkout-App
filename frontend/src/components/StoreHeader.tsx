import { ShopOutlined } from '@ant-design/icons';
import { Layout } from 'antd';

const { Header } = Layout;

export default function StoreHeader() {
  return (
    <Header className="store-header">
      <div className="store-header__inner">
        <ShopOutlined className="store-header__icon" />
        <span className="store-header__brand">JDMG Store</span>
      </div>
    </Header>
  );
}
