import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  ConfigProvider,
  Image,
  Typography,
} from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import StoreFooter from '../components/StoreFooter';
import StoreHeader from '../components/StoreHeader';
import { resetCheckout } from '../features/checkout/checkoutSlice';
import { fetchProducts } from '../features/products/productSlice';
import { formatCop, getPaymentStatusMeta, getProductImage } from '../utils/product';

const { Title, Text } = Typography;

export default function ResultPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const transaction = useAppSelector((state) => state.checkout.transaction);
  const products = useAppSelector((state) => state.products.items);

  const product = products.find((item) => item.id === transaction?.productId);

  useEffect(() => {
    if (!transaction) {
      void navigate('/', { replace: true });
      return;
    }
    void dispatch(fetchProducts());
  }, [transaction, dispatch, navigate]);

  if (!transaction) {
    return null;
  }

  const statusMeta = getPaymentStatusMeta(transaction.status);
  const StatusIcon =
    statusMeta.tone === 'approved'
      ? CheckCircleFilled
      : statusMeta.tone === 'declined'
        ? CloseCircleFilled
        : ExclamationCircleFilled;

  const handleBackToStore = () => {
    dispatch(resetCheckout());
    void dispatch(fetchProducts());
    void navigate('/');
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
      <div className="result-page">
        <StoreHeader />

        <main className="result-page__content">
          <article
            className={`result-card result-card--${statusMeta.tone}`}
            style={{ borderColor: statusMeta.color }}
          >
            <div className="result-card__status">
              <StatusIcon
                className="result-card__status-icon"
                style={{ color: statusMeta.color }}
              />
              <Title level={3} className="result-card__status-title">
                {statusMeta.label}
              </Title>
              <Text type="secondary">Referencia: {transaction.reference}</Text>
            </div>

            <div className="result-card__product">
              <div className="result-card__image-wrap">
                <Image
                  src={
                    product
                      ? getProductImage(product.name)
                      : undefined
                  }
                  alt={product?.name ?? 'Producto'}
                  preview={false}
                />
              </div>
              <div className="result-card__product-info">
                <Text strong>{product?.name ?? 'Producto'}</Text>
                <Text type="secondary">
                  {product?.description ?? 'Detalle del producto comprado'}
                </Text>
                <Text className="result-card__amount">
                  {formatCop(transaction.amount)}
                </Text>
              </div>
            </div>

            <div className="result-card__details">
              <div className="result-card__line">
                <Text type="secondary">Estado</Text>
                <Text strong style={{ color: statusMeta.color }}>
                  {transaction.status}
                </Text>
              </div>
              <div className="result-card__line">
                <Text type="secondary">Tarifa base</Text>
                <Text>{formatCop(transaction.baseFee)}</Text>
              </div>
              <div className="result-card__line">
                <Text type="secondary">Tarifa de envío</Text>
                <Text>{formatCop(transaction.deliveryFee)}</Text>
              </div>
              <div className="result-card__line">
                <Text type="secondary">Cuotas</Text>
                <Text>
                  {transaction.installments === 1
                    ? '1 cuota'
                    : `${transaction.installments} cuotas`}
                </Text>
              </div>
              <div className="result-card__line">
                <Text type="secondary">Total</Text>
                <Text strong>{formatCop(transaction.amount)}</Text>
              </div>
            </div>

            <Button
              type="primary"
              size="large"
              block
              className="result-card__back"
              onClick={handleBackToStore}
            >
              Volver al comercio
            </Button>
          </article>
        </main>

        <StoreFooter />
      </div>
    </ConfigProvider>
  );
}
