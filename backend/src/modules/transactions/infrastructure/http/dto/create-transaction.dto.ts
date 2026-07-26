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
  Min,
  ValidateNested,
} from 'class-validator';

export class CustomerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, { message: 'El teléfono debe tener 10 dígitos' })
  phone: string;
}

export class DeliveryDto {
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  fee?: number;
}

export class CreateTransactionDto {
  @IsUUID()
  productId: string;

  @ValidateNested()
  @Type(() => CustomerDto)
  customer: CustomerDto;

  @ValidateNested()
  @Type(() => DeliveryDto)
  delivery: DeliveryDto;

  @IsString()
  @IsNotEmpty()
  cardToken: string;

  @IsString()
  @IsNotEmpty()
  acceptanceToken: string;

  @IsString()
  @IsNotEmpty()
  acceptPersonalAuth: string;

  @IsOptional()
  @IsInt()
  @IsIn([1, 3, 6, 12])
  installments?: number;
}
