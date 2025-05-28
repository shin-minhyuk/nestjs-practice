import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseIntPipe,
  Request,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Role } from 'src/user/entities/user.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { TransactionInterceptor } from 'src/common/intercepter/transaction.interceptor';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  @Public()
  getMovies(@Query() dto: GetMoviesDto) {
    return this.movieService.findAll(dto);
  }

  @Get(':id')
  @Public()
  getMovie(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.findOne(id);
  }

  @Post()
  @RBAC(Role.admin)
  @UseInterceptors(TransactionInterceptor)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'movie', maxCount: 1 },
        { name: 'poster', maxCount: 2 },
      ],
      {
        limits: {
          fileSize: 20000000,
        },
        fileFilter(req, file, callback) {
          console.log(file);
          if (file.mimetype !== 'video/mp4') {
            return callback(
              new BadRequestException('MP4 타입만 업로드 가능합니다.'),
              false,
            );
          }

          return callback(null, true);
        },
      },
    ),
  )
  postMovie(
    @Body() body: CreateMovieDto,
    @Request() req,
    @UploadedFiles()
    files: {
      movie?: Express.Multer.File[];
      poster?: Express.Multer.File[];
    },
  ) {
    console.log('--------------------------------');
    console.log(files);
    return this.movieService.create(body, req.queryRunner);
  }

  @Patch(':id')
  @RBAC(Role.admin)
  patchMovie(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateMovieDto,
  ) {
    return this.movieService.update(id, body);
  }

  @Delete(':id')
  deleteMovie(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.remove(id);
  }
}
