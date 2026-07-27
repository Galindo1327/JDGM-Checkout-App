import { useEffect, useRef } from 'react';
import {
  Alert,
  Button,
  ConfigProvider,
  Image,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import {
  CloseOutlined,
  CreditCardOutlined,
  LeftOutlined,
  RightOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import CheckoutModal from '../components/CheckoutModal';
import StoreFooter from '../components/StoreFooter';
import StoreHeader from '../components/StoreHeader';
import SummaryDrawer from '../components/SummaryDrawer';
import { setStep } from '../features/checkout/checkoutSlice';
import {
  fetchProducts,
  selectProduct,
} from '../features/products/productSlice';
import { formatCop, getProductImage } from '../utils/product';
import type { Product } from '../types/checkout';

const { Title, Paragraph, Text } = Typography;

function getAvailabilityTag(stock: number) {
  if (stock < 1) {
    return { label: 'Agotado', color: 'error' as const };
  }
  if (stock < 10) {
    return { label: 'Casi Agotado', color: 'warning' as const };
  }
  return { label: 'Disponible', color: 'success' as const };
}

export default function ProductPage() {
  const dispatch = useAppDispatch();
  const catalogRef = useRef<HTMLDivElement>(null);
  const { items, selectedProductId, loading, error } = useAppSelector(
    (state) => state.products,
  );
  const checkoutStep = useAppSelector((state) => state.checkout.step);
  const checkoutOpen = checkoutStep === 'checkout';
  const summaryOpen = checkoutStep === 'summary';

  const selected =
    items.find((product) => product.id === selectedProductId) ?? items[0];
  const availability = selected
    ? getAvailabilityTag(selected.stock)
    : null;
  const isOutOfStock = Boolean(selected && selected.stock < 1);

  useEffect(() => {
    void dispatch(fetchProducts());
  }, [dispatch]);

  const handlePay = (product: Product) => {
    if (product.stock < 1) return;
    dispatch(selectProduct(product.id));
    dispatch(setStep('checkout'));
  };

  const handleCloseCheckout = () => {
    dispatch(setStep('product'));
  };

  const handleContinueToSummary = () => {
    dispatch(setStep('summary'));
  };

  const handleCloseSummary = () => {
    dispatch(setStep('product'));
  };

  const scrollCatalog = (direction: -1 | 1) => {
    const node = catalogRef.current;
    if (!node) return;
    const amount = Math.min(280, Math.round(node.clientWidth * 0.7));
    node.scrollBy({ left: direction * amount, behavior: 'smooth' });
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
        <StoreHeader />

        <main className="product-page__content">
          <div className="product-page__intro">
            <Title level={2} className="product-page__heading">
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
                    {availability && (
                      <Tag color={availability.color}>{availability.label}</Tag>
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
                    icon={
                      isOutOfStock ? <CloseOutlined /> : <CreditCardOutlined />
                    }
                    disabled={isOutOfStock}
                    onClick={() => handlePay(selected)}
                    className={`product-page__pay${isOutOfStock ? ' is-sold-out' : ''}`}
                  >
                    {isOutOfStock
                      ? 'Sin existencias'
                      : 'Pagar con tarjeta de crédito'}
                  </Button>
                </div>
              </section>

              {items.length > 1 && (
                <section className="product-page__catalog">
                  <div className="product-page__catalog-header">
                    <Text className="product-page__catalog-title">
                      Más productos
                    </Text>
                    <div className="product-page__catalog-arrows">
                      <Button
                        type="default"
                        shape="circle"
                        icon={<LeftOutlined />}
                        aria-label="Ver productos anteriores"
                        onClick={() => scrollCatalog(-1)}
                      />
                      <Button
                        type="default"
                        shape="circle"
                        icon={<RightOutlined />}
                        aria-label="Ver más productos"
                        onClick={() => scrollCatalog(1)}
                      />
                    </div>
                  </div>
                  <div
                    ref={catalogRef}
                    className="product-page__carousel"
                  >
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

        <StoreFooter />

        <CheckoutModal
          open={checkoutOpen}
          onClose={handleCloseCheckout}
          onContinue={handleContinueToSummary}
        />
        <SummaryDrawer
          open={summaryOpen}
          product={selected}
          onClose={handleCloseSummary}
        />
      </div>
    </ConfigProvider>
  );
}
