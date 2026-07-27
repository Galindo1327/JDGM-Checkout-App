import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CustomerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/, {
    message: 'El nombre solo puede contener letras y espacios',
  })
  name!: string;

  @IsEmail()
  @MaxLength(120)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, { message: 'El teléfono debe tener 10 dígitos' })
  phone!: string;
}

export class DeliveryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  address!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  @Matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/, {
    message: 'La ciudad solo puede contener letras y espacios',
  })
  city!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  fee?: number;
}

export class CreateTransactionDto {
  @IsUUID()
  productId!: string;

  @ValidateNested()
  @Type(() => CustomerDto)
  customer!: CustomerDto;

  @ValidateNested()
  @Type(() => DeliveryDto)
  delivery!: DeliveryDto;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  cardToken!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  acceptanceToken!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  acceptPersonalAuth!: string;

  @IsOptional()
  @IsInt()
  @IsIn([1, 3, 6, 12])
  installments?: number;
}
