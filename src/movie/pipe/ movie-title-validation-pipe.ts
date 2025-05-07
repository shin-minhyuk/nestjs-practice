import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
} from '@nestjs/common';

export class MovieTitleValidationPipe implements PipeTransform<string, string> {
  transform(value: any, metadata: ArgumentMetadata): string {
    // 글자 길이 2이하 에러 쓰로우
    if (value.length <= 2) {
      throw new BadRequestException('영화의 제목은 3자이상 작성해주세요.');
    }

    return value;
  }
}
