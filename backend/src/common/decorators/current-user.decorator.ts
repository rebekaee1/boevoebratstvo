import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Декоратор для получения текущего пользователя из request
 * @example
 * @Get('profile')
 * getProfile(@CurrentUser() user: User) { ... }
 * 
 * @Get('profile')
 * getUserId(@CurrentUser('id') userId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Если указано конкретное поле, возвращаем его
    if (data) {
      return user?.[data];
    }

    return user;
  },
);
