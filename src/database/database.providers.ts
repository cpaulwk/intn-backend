import * as mongoose from 'mongoose';

export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: (): Promise<typeof mongoose> =>
      mongoose.connect('mongodb+srv://cpaulwk:ssAtZ3njN8A5xDN@cluster0.ikayy.mongodb.net/intn'),
  },
];