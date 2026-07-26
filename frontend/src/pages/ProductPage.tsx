import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  ConfigProvider,
  Image,
  Layout,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import {
  CreditCardOutlined,
  ShoppingOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setStep } from '../features/checkout/checkoutSlice';
import {
  fetchProducts,
  selectProduct,
} from '../features/products/productSlice';
import { formatCop, getProductImage } from '../utils/product';
import type { Product } from '../types/checkout';

const { Header } = Layout;
const { Title, Paragraph, Text } = Typography;

export default function ProductPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, selectedProductId, loading, error } = useAppSelector(
    (state) => state.products,
  );

  const selected =
    items.find((product) => product.id === selectedProductId) ?? items[0];

  useEffect(() => {
    void dispatch(fetchProducts());
  }, [dispatch]);

  const handlePay = (product: Product) => {
    if (product.stock < 1) return;
    dispatch(selectProduct(product.id));
    dispatch(setStep('checkout'));
    void navigate('/checkout');
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#2f3437',
          colorBgBase: '#f3efe8',
          borderRadius: 14,
          fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        },
      }}
    >
      <div className="product-page">
        <Header className="store-header">
          <div className="store-header__inner">
            <ShopOutlined className="store-header__icon" />
            <span className="store-header__brand">JDMG Store</span>
          </div>
        </Header>

        <main className="product-page__content">
          <div className="product-page__intro">
            <Title level={3} className="product-page__heading">
              Elige tu producto
            </Title>
            <Paragraph className="product-page__subtitle">
              Revisa disponibilidad y paga con tarjeta de crédito.
            </Paragraph>
          </div>

          {loading && (
            <div className="product-page__center">
              <Spin size="large" tip="Cargando productos..." />
            </div>
          )}

          {!loading && error && (
            <Alert
              type="error"
              showIcon
              message="No se pudieron cargar los productos"
              description={error}
              action={
                <Button
                  size="small"
                  onClick={() => void dispatch(fetchProducts())}
                >
                  Reintentar
                </Button>
              }
            />
          )}

          {!loading && !error && items.length === 0 && (
            <Alert
              type="info"
              showIcon
              message="No hay productos disponibles"
            />
          )}

          {!loading && !error && selected && (
            <>
              <section className="product-page__hero">
                <div className="product-page__image-wrap">
                  <Image
                    src={getProductImage(selected.name)}
                    alt={selected.name}
                    preview={false}
                    className="product-page__image"
                  />
                </div>

                <div className="product-page__details">
                  <Space size={[8, 8]} wrap>
                    <Tag icon={<ShoppingOutlined />} color="default">
                      Stock: {selected.stock}
                    </Tag>
                    {selected.stock < 1 ? (
                      <Tag color="error">Agotado</Tag>
                    ) : (
                      <Tag color="success">Disponible</Tag>
                    )}
                  </Space>

                  <Title level={2} className="product-page__name">
                    {selected.name}
                  </Title>
                  <Paragraph className="product-page__description">
                    {selected.description}
                  </Paragraph>
                  <Text className="product-page__price">
                    {formatCop(selected.price)}
                  </Text>

                  <Button
                    type="primary"
                    size="large"
                    block
                    icon={<CreditCardOutlined />}
                    disabled={selected.stock < 1}
                    onClick={() => handlePay(selected)}
                    className="product-page__pay"
                  >
                    Pagar con tarjeta de crédito
                  </Button>
                </div>
              </section>

              {items.length > 1 && (
                <section className="product-page__catalog">
                  <Text className="product-page__catalog-title">
                    Más productos
                  </Text>
                  <div className="product-page__grid">
                    {items.map((product) => {
                      const active = product.id === selected.id;
                      return (
                        <button
                          key={product.id}
                          type="button"
                          className={`product-card ${active ? 'is-active' : ''}`}
                          onClick={() => dispatch(selectProduct(product.id))}
                        >
                          <div className="product-card__image-wrap">
                            <img
                              src={getProductImage(product.name)}
                              alt={product.name}
                              className="product-card__image"
                            />
                          </div>
                          <div className="product-card__body">
                            <Text strong>{product.name}</Text>
                            <Text type="secondary">
                              {formatCop(product.price)}
                            </Text>
                            <Text type="secondary">
                              Stock: {product.stock}
                            </Text>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </ConfigProvider>
  );
}
