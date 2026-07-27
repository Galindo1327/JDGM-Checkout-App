import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Col,
  ConfigProvider,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Typography,
} from 'antd';
import { CloseOutlined, CreditCardOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  setAcceptanceTokens,
  setAcceptedPersonalData,
  setAcceptedPrivacy,
  setCard,
  setCustomer,
  setDelivery,
  setInstallments,
  setStep,
} from '../features/checkout/checkoutSlice';
import { getAcceptanceTokens } from '../services/payment-provider';
import {
  detectCardBrand,
  formatCardNumber,
  getCardBrandLogo,
  onlyDigits,
} from '../utils/card';
import { isLettersAndSpaces, onlyLettersAndSpaces } from '../utils/text';

const { Text, Link, Title } = Typography;

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
}

interface CheckoutFormValues {
  cardHolder: string;
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvc: string;
  installments: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  acceptedPrivacy: boolean;
  acceptedPersonalData: boolean;
}

export default function CheckoutModal({
  open,
  onClose,
  onContinue,
}: CheckoutModalProps) {
  const dispatch = useAppDispatch();
  const [form] = Form.useForm<CheckoutFormValues>();
  const checkout = useAppSelector((state) => state.checkout);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [tokensError, setTokensError] = useState<string | null>(null);

  const cardNumber = Form.useWatch('cardNumber', form) ?? '';
  const watchedValues = Form.useWatch([], form) as
    | Partial<CheckoutFormValues>
    | undefined;
  const brand = useMemo(() => detectCardBrand(cardNumber), [cardNumber]);
  const brandLogo = getCardBrandLogo(brand);

  const canContinue = useMemo(() => {
    if (loadingTokens) return false;
    if (!checkout.acceptanceToken || !checkout.acceptPersonalAuth) return false;
    if (!watchedValues) return false;

    const cardHolder = watchedValues.cardHolder?.trim() ?? '';
    const cardDigits = onlyDigits(watchedValues.cardNumber ?? '');
    const cardBrand = detectCardBrand(cardDigits);
    const cvc = watchedValues.cvc ?? '';
    const name = watchedValues.name?.trim() ?? '';
    const email = watchedValues.email?.trim() ?? '';
    const phone = watchedValues.phone ?? '';
    const address = watchedValues.address?.trim() ?? '';
    const city = watchedValues.city?.trim() ?? '';

    if (!cardHolder) return false;
    if (cardDigits.length < 13 || cardDigits.length > 19) return false;
    if (cardBrand === 'unknown') return false;
    if (!watchedValues.expMonth || !watchedValues.expYear) return false;
    if (!/^\d{3,4}$/.test(cvc)) return false;
    if (![1, 3, 6, 12].includes(Number(watchedValues.installments))) return false;
    if (!isLettersAndSpaces(name)) return false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
    if (!/^\d{10}$/.test(phone)) return false;
    if (!address || !isLettersAndSpaces(city)) return false;
    if (!watchedValues.acceptedPrivacy || !watchedValues.acceptedPersonalData) {
      return false;
    }

    return true;
  }, [
    watchedValues,
    loadingTokens,
    checkout.acceptanceToken,
    checkout.acceptPersonalAuth,
  ]);

  const months = Array.from({ length: 12 }, (_, i) => {
    const value = String(i + 1).padStart(2, '0');
    return { value, label: value };
  });

  const currentYear = new Date().getFullYear() % 100;
  const years = Array.from({ length: 12 }, (_, i) => {
    const value = String(currentYear + i).padStart(2, '0');
    return { value, label: `20${value}` };
  });

  useEffect(() => {
    if (!open) return;

    form.setFieldsValue({
      cardHolder: checkout.card.cardHolder,
      cardNumber: checkout.card.number,
      expMonth: checkout.card.expMonth,
      expYear: checkout.card.expYear,
      cvc: checkout.card.cvc,
      installments: checkout.installments || 1,
      name: checkout.customer.name,
      email: checkout.customer.email,
      phone: checkout.customer.phone,
      address: checkout.delivery.address,
      city: checkout.delivery.city,
      acceptedPrivacy: checkout.acceptedPrivacy,
      acceptedPersonalData: checkout.acceptedPersonalData,
    });
  }, [open, form, checkout]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadTokens() {
      setLoadingTokens(true);
      setTokensError(null);
      try {
        const tokens = await getAcceptanceTokens();
        if (cancelled) return;
        dispatch(setAcceptanceTokens(tokens));
      } catch {
        if (!cancelled) {
          setTokensError('No se pudieron cargar las políticas del proveedor de pagos.');
        }
      } finally {
        if (!cancelled) setLoadingTokens(false);
      }
    }

    void loadTokens();

    return () => {
      cancelled = true;
    };
  }, [open, dispatch]);

  const handleFinish = (values: CheckoutFormValues) => {
    dispatch(
      setCard({
        cardHolder: values.cardHolder.trim(),
        number: formatCardNumber(values.cardNumber),
        expMonth: values.expMonth,
        expYear: values.expYear,
        cvc: values.cvc,
      }),
    );
    dispatch(
      setCustomer({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
      }),
    );
    dispatch(
      setDelivery({
        address: values.address.trim(),
        city: values.city.trim(),
        fee: checkout.delivery.fee ?? 8000,
      }),
    );
    dispatch(setAcceptedPrivacy(values.acceptedPrivacy));
    dispatch(setAcceptedPersonalData(values.acceptedPersonalData));
    dispatch(setInstallments(Number(values.installments)));
    dispatch(setStep('summary'));
    onContinue();
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1f5a34',
          colorBgContainer: '#ffffff',
          colorBgElevated: '#ffffff',
          borderRadius: 10,
        },
      }}
    >
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      centered
      width={560}
      className="checkout-modal"
      wrapClassName="checkout-modal-wrap"
      closable={false}
      title={null}
      styles={{
        mask: {
          backdropFilter: 'blur(8px)',
          background: 'rgba(26, 33, 28, 0.48)',
        },
        body: {
          padding: 0,
        },
      }}
    >
      <div className="checkout-modal__shell">
        <header className="checkout-modal__header">
          <div className="checkout-modal__header-left">
            <CreditCardOutlined className="checkout-modal__header-icon" />
            <span className="checkout-modal__header-title">
              Datos de pago y entrega
            </span>
          </div>
          <button
            type="button"
            className="checkout-modal__close"
            aria-label="Cerrar"
            onClick={onClose}
          >
            <CloseOutlined />
          </button>
        </header>

        <div className="checkout-modal__body">
      {loadingTokens && (
        <div className="checkout-modal__loading">
          <Spin tip="Cargando políticas..." />
        </div>
      )}

      {tokensError && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message={tokensError}
          action={
            <Button
              size="small"
              onClick={() => {
                setTokensError(null);
                setLoadingTokens(true);
                void getAcceptanceTokens()
                  .then((tokens) => {
                    dispatch(setAcceptanceTokens(tokens));
                  })
                  .catch(() => {
                    setTokensError(
                      'No se pudieron cargar las políticas del proveedor de pagos.',
                    );
                  })
                  .finally(() => setLoadingTokens(false));
              }}
            >
              Reintentar
            </Button>
          }
        />
      )}

      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        onFinish={handleFinish}
        disabled={loadingTokens}
        className="checkout-modal__form"
      >
        <Title level={3}>Tarjeta de crédito</Title>

        <Form.Item
          label="Nombre del titular"
          name="cardHolder"
          rules={[{ required: true, message: 'Ingresa el nombre del titular' }]}
        >
          <Input placeholder="Como aparece en la tarjeta" maxLength={60} />
        </Form.Item>

        <Form.Item
          label="Número de tarjeta"
          name="cardNumber"
          rules={[
            { required: true, message: 'Ingresa el número de tarjeta' },
            {
              validator: (_, value?: string) => {
                const digits = onlyDigits(value ?? '');
                if (digits.length < 13 || digits.length > 19) {
                  return Promise.reject(
                    new Error('El número debe tener entre 13 y 19 dígitos'),
                  );
                }
                const detected = detectCardBrand(digits);
                if (detected === 'unknown') {
                  return Promise.reject(
                    new Error('Solo se aceptan Visa o Mastercard'),
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
          getValueFromEvent={(event: ChangeEvent<HTMLInputElement>) =>
            formatCardNumber(event.target.value)
          }
        >
          <Input
            placeholder="4242 4242 4242 4242"
            inputMode="numeric"
            suffix={
              brandLogo ? (
                <img
                  src={brandLogo}
                  alt={brand}
                  className="checkout-modal__brand"
                />
              ) : (
                <span className="checkout-modal__brand-placeholder" />
              )
            }
          />
        </Form.Item>

        <Row gutter={12}>
          <Col xs={12} sm={8}>
            <Form.Item
              label="Mes"
              name="expMonth"
              rules={[{ required: true, message: 'Mes' }]}
            >
              <Select
                options={months}
                placeholder="MM"
                className="checkout-modal__select"
                styles={{
                  root: { background: '#ffffff' },
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8}>
            <Form.Item
              label="Año"
              name="expYear"
              rules={[{ required: true, message: 'Año' }]}
            >
              <Select
                options={years}
                placeholder="AA"
                className="checkout-modal__select"
                styles={{
                  root: { background: '#ffffff' },
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              label="CVC"
              name="cvc"
              rules={[
                { required: true, message: 'Ingresa el CVC' },
                {
                  pattern: /^\d{3,4}$/,
                  message: 'CVC de 3 o 4 dígitos',
                },
              ]}
              getValueFromEvent={(event: ChangeEvent<HTMLInputElement>) =>
                onlyDigits(event.target.value).slice(0, 4)
              }
            >
              <Input placeholder="123" inputMode="numeric" maxLength={4} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Cuotas"
          name="installments"
          rules={[{ required: true, message: 'Selecciona las cuotas' }]}
        >
          <Select
            options={[
              { value: 1, label: '1 cuota' },
              { value: 3, label: '3 cuotas' },
              { value: 6, label: '6 cuotas' },
              { value: 12, label: '12 cuotas' },
            ]}
          />
        </Form.Item>

        <Title level={3}>Datos de entrega</Title>

        <Form.Item
          label="Nombre completo"
          name="name"
          rules={[
            { required: true, message: 'Ingresa tu nombre' },
            {
              validator: (_, value?: string) =>
                isLettersAndSpaces(value ?? '')
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error('Solo letras y espacios'),
                    ),
            },
          ]}
          getValueFromEvent={(event: ChangeEvent<HTMLInputElement>) =>
            onlyLettersAndSpaces(event.target.value)
          }
        >
          <Input placeholder="Juan Pérez" maxLength={80} />
        </Form.Item>

        <Form.Item
          label="Correo"
          name="email"
          rules={[
            { required: true, message: 'Ingresa tu correo' },
            { type: 'email', message: 'Correo inválido' },
          ]}
        >
          <Input placeholder="correo@ejemplo.com" inputMode="email" />
        </Form.Item>

        <Form.Item
          label="Teléfono"
          name="phone"
          rules={[
            { required: true, message: 'Ingresa tu teléfono' },
            {
              pattern: /^\d{10}$/,
              message: 'El teléfono debe tener 10 dígitos',
            },
          ]}
          getValueFromEvent={(event: ChangeEvent<HTMLInputElement>) =>
            onlyDigits(event.target.value).slice(0, 10)
          }
        >
          <Input
            placeholder="3001234567"
            inputMode="tel"
            maxLength={10}
          />
        </Form.Item>

        <Form.Item
          label="Dirección"
          name="address"
          rules={[{ required: true, message: 'Ingresa la dirección' }]}
        >
          <Input placeholder="Calle 123 #45-67" maxLength={120} />
        </Form.Item>

        <Form.Item
          label="Ciudad"
          name="city"
          rules={[
            { required: true, message: 'Ingresa la ciudad' },
            {
              validator: (_, value?: string) =>
                isLettersAndSpaces(value ?? '')
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error('Solo letras y espacios'),
                    ),
            },
          ]}
          getValueFromEvent={(event: ChangeEvent<HTMLInputElement>) =>
            onlyLettersAndSpaces(event.target.value)
          }
        >
          <Input placeholder="Bogotá" maxLength={60} />
        </Form.Item>

        <Space direction="vertical" size={1} className="checkout-modal__policies">
          <Form.Item
            name="acceptedPrivacy"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error('Debes aceptar la política de privacidad'),
                      ),
              },
            ]}
          >
            <Checkbox>
              Acepto la{' '}
              <Link
                className="checkout-modal__policy-link"
                href={checkout.permalinkPrivacy || undefined}
                target="_blank"
                rel="noreferrer"
              >
                política de privacidad
              </Link>
            </Checkbox>
          </Form.Item>

          <Form.Item
            name="acceptedPersonalData"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error(
                          'Debes aceptar el tratamiento de datos personales',
                        ),
                      ),
              },
            ]}
          >
            <Checkbox>
              Acepto el{' '}
              <Link
                className="checkout-modal__policy-link"
                href={checkout.permalinkPersonalData || undefined}
                target="_blank"
                rel="noreferrer"
              >
                tratamiento de datos personales
              </Link>
            </Checkbox>
          </Form.Item>
        </Space>

        {!checkout.acceptanceToken || !checkout.acceptPersonalAuth ? (
          <Text type="secondary" className="checkout-modal__hint">
            Espera a que carguen las políticas para continuar.
          </Text>
        ) : null}

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          className="checkout-modal__submit"
          disabled={!canContinue}
        >
          Continuar al resumen
        </Button>
      </Form>
        </div>
      </div>
    </Modal>
    </ConfigProvider>
  );
}
