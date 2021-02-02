import {
  Column,
  CreatedAt,
  DataType,
  DeletedAt,
  HasMany,
  Model,
  Table,
  TableOptions,
  UpdatedAt,
} from 'sequelize-typescript';
import { Symptom } from '../symptoms/symptom.model';

const tableOptions: TableOptions = {
  tableName: 'Users',
  timestamps: true,
  paranoid: true,
};

@Table(tableOptions)
export class User extends Model<User> {
  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  id: string;

  @Column({
    type: DataType.STRING,
    unique: true,
  })
  lineId: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    validate: {
      isEmail: true,
    },
  })
  email: string;

  @Column({
    type: DataType.STRING,
  })
  name: string;

  @Column({
    type: DataType.INTEGER,
  })
  age: number;

  @HasMany(() => Symptom)
  symptoms: Symptom[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt: Date;
}
