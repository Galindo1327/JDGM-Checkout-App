import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
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
  @Min(1)
  @Max(36)
  installments?: number;
}
