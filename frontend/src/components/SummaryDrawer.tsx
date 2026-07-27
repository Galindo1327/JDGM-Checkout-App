import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  ConfigProvider,
  Divider,
  Drawer,
  Image,
  Space,
  Typography,
} from 'antd';
import { CreditCardOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  setCheckoutError,
  setPaying,
  setStep,
  setTransaction,
} from '../features/checkout/checkoutSlice';
import { fetchProducts } from '../features/products/productSlice';
import { createTransaction } from '../services/api';
import { tokenizeCard } from '../services/payment-provider';
import { detectCardBrand, getCardBrandLogo, onlyDigits } from '../utils/card';
import { getErrorMessage } from '../utils/errors';
import { BASE_FEE, formatCop, getProductImage } from '../utils/product';
import type { Product } from '../types/checkout';

const { Title, Text } = Typography;

interface SummaryDrawerProps {
  open: boolean;
  product: Product | undefined;
  onClose: () => void;
}

export default function SummaryDrawer({
  open,
  product,
  onClose,
}: SummaryDrawerProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const checkout = useAppSelector((state) => state.checkout);
  const [localError, setLocalError] = useState<string | null>(null);

  const deliveryFee = checkout.delivery.fee ?? 8000;
  const productPrice = product?.price ?? 0;
  const total = productPrice + BASE_FEE + deliveryFee;

  const cardDigits = onlyDigits(checkout.card.number);
  const brand = detectCardBrand(cardDigits);
  const brandLogo = getCardBrandLogo(brand);
  const lastFour = cardDigits.slice(-4);

  const canPay = useMemo(() => {
    return Boolean(
      product &&
        checkout.acceptanceToken &&
        checkout.acceptPersonalAuth &&
        checkout.card.number &&
        checkout.card.cvc &&
        checkout.customer.email,
    );
  }, [product, checkout]);

  const handlePay = async () => {
    if (!product || checkout.paying) return;

    setLocalError(null);
    dispatch(setCheckoutError(null));
    dispatch(setPaying(true));

    try {
      const cardToken = await tokenizeCard({
        number: checkout.card.number,
        cvc: checkout.card.cvc,
        expMonth: checkout.card.expMonth,
        expYear: checkout.card.expYear,
        cardHolder: checkout.card.cardHolder,
      });

      const transaction = await createTransaction({
        productId: product.id,
        customer: checkout.customer,
        delivery: {
          address: checkout.delivery.address,
          city: checkout.delivery.city,
          fee: deliveryFee,
        },
        cardToken,
        acceptanceToken: checkout.acceptanceToken,
        acceptPersonalAuth: checkout.acceptPersonalAuth,
        installments: checkout.installments,
      });

      dispatch(setTransaction(transaction));
      dispatch(setStep('result'));
      void dispatch(fetchProducts());
      onClose();
      void navigate('/result');
    } catch (error) {
      const message = getErrorMessage(error);
      setLocalError(message);
      dispatch(setCheckoutError(message));
    } finally {
      dispatch(setPaying(false));
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1f5a34',
          colorBgContainer: '#ffffff',
          borderRadius: 12,
        },
      }}
    >
      <Drawer
        open={open}
        onClose={onClose}
        placement="bottom"
        height="90%"
        className="summary-drawer"
        title="Resumen de pago"
        destroyOnHidden
      >
        <div className="summary-drawer__content">
          {product && (
            <div className="summary-drawer__product">
              <div className="summary-drawer__image-wrap">
                <Image
                  src={getProductImage(product.name)}
                  alt={product.name}
                  preview={false}
                />
              </div>
              <div className="summary-drawer__product-info">
                <Title level={4} className="summary-drawer__product-name">
                  {product.name}
                </Title>
                <Text type="secondary">{product.description}</Text>
                <Text className="summary-drawer__product-price">
                  {formatCop(product.price)}
                </Text>
              </div>
            </div>
          )}

          <Divider />

          <div className="summary-drawer__lines">
            <div className="summary-drawer__line">
              <Text>Producto</Text>
              <Text>{formatCop(productPrice)}</Text>
            </div>
            <div className="summary-drawer__line">
              <Text>Tarifa base</Text>
              <Text>{formatCop(BASE_FEE)}</Text>
            </div>
            <div className="summary-drawer__line">
              <Text>Tarifa de envío</Text>
              <Text>{formatCop(deliveryFee)}</Text>
            </div>
            <div className="summary-drawer__line">
              <Text>Cuotas</Text>
              <Text>
                {checkout.installments === 1
                  ? '1 cuota'
                  : `${checkout.installments} cuotas`}
              </Text>
            </div>
            <div className="summary-drawer__line summary-drawer__line--total">
              <Text strong>Total</Text>
              <Text strong>{formatCop(total)}</Text>
            </div>
          </div>

          <Divider />

          <div className="summary-drawer__meta">
            <Text type="secondary">Entrega</Text>
            <Text>
              {checkout.delivery.address}, {checkout.delivery.city}
            </Text>
            <Text type="secondary">Cliente</Text>
            <Text>
              {checkout.customer.name} · {checkout.customer.email}
            </Text>
            <Text type="secondary">Tarjeta</Text>
            <Space size={8} align="center">
              {brandLogo ? (
                <img
                  src={brandLogo}
                  alt={brand}
                  className="summary-drawer__brand"
                />
              ) : null}
              <Text>•••• {lastFour || '----'}</Text>
            </Space>
          </div>

          {localError && (
            <Alert
              type="error"
              showIcon
              style={{ marginTop: 16 }}
              message="Error al pagar"
              description={localError}
            />
          )}

          <Button
            type="primary"
            size="large"
            block
            icon={<CreditCardOutlined />}
            className="summary-drawer__pay"
            loading={checkout.paying}
            disabled={!canPay || checkout.paying}
            onClick={() => void handlePay()}
          >
            {checkout.paying ? 'Procesando pago...' : 'Pagar ahora'}
          </Button>
        </div>
      </Drawer>
    </ConfigProvider>
  );
}
