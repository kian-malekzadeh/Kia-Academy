import {
  IsEmail,
  IsString,
  Matches,
  MinLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import type { RegisterDto as RegisterDtoType } from '@kia-academy/shared';
import {
  isValidIranCity,
  isValidIranProvince,
  SECURE_PASSWORD_MESSAGE,
  SECURE_PASSWORD_PATTERN,
} from '@kia-academy/shared';

@ValidatorConstraint({ name: 'PasswordsMatch', async: false })
class PasswordsMatchConstraint implements ValidatorConstraintInterface {
  validate(passwordConfirm: string, args: ValidationArguments) {
    const obj = args.object as RegisterDto;
    return typeof passwordConfirm === 'string' && passwordConfirm === obj.password;
  }

  defaultMessage() {
    return 'Passwords do not match';
  }
}

@ValidatorConstraint({ name: 'IranProvinceCity', async: false })
class IranProvinceCityConstraint implements ValidatorConstraintInterface {
  validate(_city: string, args: ValidationArguments) {
    const obj = args.object as RegisterDto;
    return isValidIranProvince(obj.province) && isValidIranCity(obj.province, obj.city);
  }

  defaultMessage() {
    return 'Province and city must be a valid Iran location pair';
  }
}

export class RegisterDto implements RegisterDtoType {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Matches(SECURE_PASSWORD_PATTERN, {
    message: SECURE_PASSWORD_MESSAGE,
  })
  password!: string;

  @IsString()
  @Validate(PasswordsMatchConstraint)
  passwordConfirm!: string;

  @IsString()
  @MinLength(1)
  province!: string;

  @IsString()
  @MinLength(1)
  @Validate(IranProvinceCityConstraint)
  city!: string;
}
