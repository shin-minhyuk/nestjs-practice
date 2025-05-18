import { BadRequestException, Injectable } from '@nestjs/common';
import { PagePaginationDto } from './dto/page-pagination.dto';
import { SelectQueryBuilder } from 'typeorm';
import { CursorPaginationDto } from './dto/cursor-pagination.dto';

@Injectable()
export class CommonService {
  constructor() {}

  applyPagePaginationParamsToQb<T>(
    qb: SelectQueryBuilder<T>,
    dto: PagePaginationDto,
  ) {
    const { take, page } = dto;

    if (take && page) {
      const skip = (page - 1) * take;

      qb.take(take);
      qb.skip(skip);
    }
  }

  async applyCursorPaginationParamsToQb<T>(
    qb: SelectQueryBuilder<T>,
    dto: CursorPaginationDto,
  ) {
    const { cursor, take } = dto;
    let { order } = dto;

    if (cursor) {
      const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');
      const cursorObj = JSON.parse(decodedCursor);

      order = cursorObj.order;
      const { values } = cursorObj;

      const whereConditions = [];
      const parameters = {};

      const [firstColumn, firstDirection] = order[0].split('_');
      const firstOperator = firstDirection === 'DESC' ? '<' : '>';

      whereConditions.push(
        `${qb.alias}.${firstColumn} ${firstOperator} :cursor_${firstColumn}`,
      );
      parameters[`cursor_${firstColumn}`] = values[firstColumn];

      for (let i = 1; i < order.length; i++) {
        const [column, direction] = order[i].split('_');
        const operator = direction === 'DESC' ? '<' : '>';

        let equalCondition = '';

        for (let j = 0; j < i; j++) {
          const [prevColumn] = order[j].split('_');
          equalCondition += `${qb.alias}.${prevColumn} = :cursor_${prevColumn} AND `;
        }

        whereConditions.push(
          `(${equalCondition}${qb.alias}.${column} ${operator} :cursor_${column})`,
        );
        parameters[`cursor_${column}`] = values[column];
      }

      if (whereConditions.length > 0) {
        qb.andWhere(`(${whereConditions.join(' OR ')})`, parameters);
      }
    }

    for (let i = 0; i < order.length; i++) {
      const [column, direction] = order[i].split('_');

      if (direction !== 'ASC' && direction !== 'DESC') {
        throw new BadRequestException(
          'order는 ASC 또는 DESC으로 입력해주세요.',
        );
      }

      if (i === 0) {
        qb.orderBy(`${qb.alias}.${column}`, direction);
      } else {
        qb.addOrderBy(`${qb.alias}.${column}`, direction);
      }
    }

    qb.take(take); // take => Limit, skip => Offset

    const data = await qb.getMany();
    const nextCursor = this.generateNextCursor(data, order);

    return { data, nextCursor };
  }

  generateNextCursor<T>(results: T[], order: string[]): string | null {
    if (results.length === 0) return null;

    /**
     * {
     *  values : {
     *     id : 27
     *  },
     *  orders: ["id_ASC"]
     * }
     */

    const lastItem = results[results.length - 1];
    const values = {};

    order.forEach((columnOrder) => {
      const [column] = columnOrder.split('_');
      values[column] = lastItem[column];
    });

    const cursorObj = { values, order };
    const nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString(
      'base64',
    );

    return nextCursor;
  }
}
