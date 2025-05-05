import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { Repository } from 'typeorm';
import { Genre } from './entities/genre.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class GenreService {
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
  ) {}

  create(createGenreDto: CreateGenreDto) {
    return this.genreRepository.save(createGenreDto);
  }

  findAll() {
    return this.genreRepository.find();
  }

  findOne(id: number) {
    const genre = this.genreRepository.find({
      where: { id },
    });

    if (!genre) {
      throw new NotFoundException('존재하지 않는 장르 입니다.');
    }

    return genre;
  }

  async update(id: number, updateGenreDto: UpdateGenreDto) {
    const genre = this.genreRepository.find({
      where: { id },
    });

    if (!genre) {
      throw new NotFoundException('존재하지 않는 장르 입니다.');
    }

    await this.genreRepository.update({ id }, { ...updateGenreDto });

    const newGenre = this.genreRepository.find({
      where: { id },
    });

    return newGenre;
  }

  remove(id: number) {
    return this.genreRepository.delete(id);
  }
}
