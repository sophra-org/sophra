
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model AnalysisSession
 * 
 */
export type AnalysisSession = $Result.DefaultSelection<Prisma.$AnalysisSessionPayload>
/**
 * Model TestFile
 * 
 */
export type TestFile = $Result.DefaultSelection<Prisma.$TestFilePayload>
/**
 * Model TestAnalysis
 * 
 */
export type TestAnalysis = $Result.DefaultSelection<Prisma.$TestAnalysisPayload>
/**
 * Model TestPattern
 * 
 */
export type TestPattern = $Result.DefaultSelection<Prisma.$TestPatternPayload>
/**
 * Model FixPattern
 * 
 */
export type FixPattern = $Result.DefaultSelection<Prisma.$FixPatternPayload>
/**
 * Model TestExecution
 * 
 */
export type TestExecution = $Result.DefaultSelection<Prisma.$TestExecutionPayload>
/**
 * Model TestCoverage
 * 
 */
export type TestCoverage = $Result.DefaultSelection<Prisma.$TestCoveragePayload>
/**
 * Model TestFix
 * 
 */
export type TestFix = $Result.DefaultSelection<Prisma.$TestFixPayload>
/**
 * Model TestGeneration
 * 
 */
export type TestGeneration = $Result.DefaultSelection<Prisma.$TestGenerationPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const TestHealthScore: {
  EXCELLENT: 'EXCELLENT',
  GOOD: 'GOOD',
  FAIR: 'FAIR',
  POOR: 'POOR',
  CRITICAL: 'CRITICAL'
};

export type TestHealthScore = (typeof TestHealthScore)[keyof typeof TestHealthScore]


export const FixType: {
  ASSERTION: 'ASSERTION',
  SETUP: 'SETUP',
  TEARDOWN: 'TEARDOWN',
  ASYNC: 'ASYNC',
  MOCK: 'MOCK',
  TIMING: 'TIMING',
  DEPENDENCY: 'DEPENDENCY',
  LOGIC: 'LOGIC',
  OTHER: 'OTHER'
};

export type FixType = (typeof FixType)[keyof typeof FixType]


export const GenerationType: {
  COVERAGE_GAP: 'COVERAGE_GAP',
  ENHANCEMENT: 'ENHANCEMENT',
  REGRESSION: 'REGRESSION',
  EDGE_CASE: 'EDGE_CASE'
};

export type GenerationType = (typeof GenerationType)[keyof typeof GenerationType]


export const SessionStatus: {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus]


export const PatternType: {
  TEST_STRUCTURE: 'TEST_STRUCTURE',
  ASSERTION_STYLE: 'ASSERTION_STYLE',
  MOCK_USAGE: 'MOCK_USAGE',
  SETUP_PATTERN: 'SETUP_PATTERN',
  ERROR_HANDLING: 'ERROR_HANDLING',
  ASYNC_PATTERN: 'ASYNC_PATTERN'
};

export type PatternType = (typeof PatternType)[keyof typeof PatternType]

}

export type TestHealthScore = $Enums.TestHealthScore

export const TestHealthScore: typeof $Enums.TestHealthScore

export type FixType = $Enums.FixType

export const FixType: typeof $Enums.FixType

export type GenerationType = $Enums.GenerationType

export const GenerationType: typeof $Enums.GenerationType

export type SessionStatus = $Enums.SessionStatus

export const SessionStatus: typeof $Enums.SessionStatus

export type PatternType = $Enums.PatternType

export const PatternType: typeof $Enums.PatternType

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more AnalysisSessions
 * const analysisSessions = await prisma.analysisSession.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more AnalysisSessions
   * const analysisSessions = await prisma.analysisSession.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs>

      /**
   * `prisma.analysisSession`: Exposes CRUD operations for the **AnalysisSession** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AnalysisSessions
    * const analysisSessions = await prisma.analysisSession.findMany()
    * ```
    */
  get analysisSession(): Prisma.AnalysisSessionDelegate<ExtArgs>;

  /**
   * `prisma.testFile`: Exposes CRUD operations for the **TestFile** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TestFiles
    * const testFiles = await prisma.testFile.findMany()
    * ```
    */
  get testFile(): Prisma.TestFileDelegate<ExtArgs>;

  /**
   * `prisma.testAnalysis`: Exposes CRUD operations for the **TestAnalysis** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TestAnalyses
    * const testAnalyses = await prisma.testAnalysis.findMany()
    * ```
    */
  get testAnalysis(): Prisma.TestAnalysisDelegate<ExtArgs>;

  /**
   * `prisma.testPattern`: Exposes CRUD operations for the **TestPattern** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TestPatterns
    * const testPatterns = await prisma.testPattern.findMany()
    * ```
    */
  get testPattern(): Prisma.TestPatternDelegate<ExtArgs>;

  /**
   * `prisma.fixPattern`: Exposes CRUD operations for the **FixPattern** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more FixPatterns
    * const fixPatterns = await prisma.fixPattern.findMany()
    * ```
    */
  get fixPattern(): Prisma.FixPatternDelegate<ExtArgs>;

  /**
   * `prisma.testExecution`: Exposes CRUD operations for the **TestExecution** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TestExecutions
    * const testExecutions = await prisma.testExecution.findMany()
    * ```
    */
  get testExecution(): Prisma.TestExecutionDelegate<ExtArgs>;

  /**
   * `prisma.testCoverage`: Exposes CRUD operations for the **TestCoverage** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TestCoverages
    * const testCoverages = await prisma.testCoverage.findMany()
    * ```
    */
  get testCoverage(): Prisma.TestCoverageDelegate<ExtArgs>;

  /**
   * `prisma.testFix`: Exposes CRUD operations for the **TestFix** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TestFixes
    * const testFixes = await prisma.testFix.findMany()
    * ```
    */
  get testFix(): Prisma.TestFixDelegate<ExtArgs>;

  /**
   * `prisma.testGeneration`: Exposes CRUD operations for the **TestGeneration** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TestGenerations
    * const testGenerations = await prisma.testGeneration.findMany()
    * ```
    */
  get testGeneration(): Prisma.TestGenerationDelegate<ExtArgs>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.1.0
   * Query Engine version: 4123509d24aa4dede1e864b46351bf2790323b69
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    AnalysisSession: 'AnalysisSession',
    TestFile: 'TestFile',
    TestAnalysis: 'TestAnalysis',
    TestPattern: 'TestPattern',
    FixPattern: 'FixPattern',
    TestExecution: 'TestExecution',
    TestCoverage: 'TestCoverage',
    TestFix: 'TestFix',
    TestGeneration: 'TestGeneration'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "analysisSession" | "testFile" | "testAnalysis" | "testPattern" | "fixPattern" | "testExecution" | "testCoverage" | "testFix" | "testGeneration"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      AnalysisSession: {
        payload: Prisma.$AnalysisSessionPayload<ExtArgs>
        fields: Prisma.AnalysisSessionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AnalysisSessionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnalysisSessionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AnalysisSessionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnalysisSessionPayload>
          }
          findFirst: {
            args: Prisma.AnalysisSessionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnalysisSessionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AnalysisSessionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnalysisSessionPayload>
          }
          findMany: {
            args: Prisma.AnalysisSessionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnalysisSessionPayload>[]
          }
          create: {
            args: Prisma.AnalysisSessionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnalysisSessionPayload>
          }
          createMany: {
            args: Prisma.AnalysisSessionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AnalysisSessionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnalysisSessionPayload>[]
          }
          delete: {
            args: Prisma.AnalysisSessionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnalysisSessionPayload>
          }
          update: {
            args: Prisma.AnalysisSessionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnalysisSessionPayload>
          }
          deleteMany: {
            args: Prisma.AnalysisSessionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AnalysisSessionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.AnalysisSessionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnalysisSessionPayload>
          }
          aggregate: {
            args: Prisma.AnalysisSessionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAnalysisSession>
          }
          groupBy: {
            args: Prisma.AnalysisSessionGroupByArgs<ExtArgs>
            result: $Utils.Optional<AnalysisSessionGroupByOutputType>[]
          }
          count: {
            args: Prisma.AnalysisSessionCountArgs<ExtArgs>
            result: $Utils.Optional<AnalysisSessionCountAggregateOutputType> | number
          }
        }
      }
      TestFile: {
        payload: Prisma.$TestFilePayload<ExtArgs>
        fields: Prisma.TestFileFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TestFileFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestFilePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TestFileFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestFilePayload>
          }
          findFirst: {
            args: Prisma.TestFileFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestFilePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TestFileFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestFilePayload>
          }
          findMany: {
            args: Prisma.TestFileFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestFilePayload>[]
          }
          create: {
            args: Prisma.TestFileCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestFilePayload>
          }
          createMany: {
            args: Prisma.TestFileCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TestFileCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestFilePayload>[]
          }
          delete: {
            args: Prisma.TestFileDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestFilePayload>
          }
          update: {
            args: Prisma.TestFileUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestFilePayload>
          }
          deleteMany: {
            args: Prisma.TestFileDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TestFileUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TestFileUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestFilePayload>
          }
          aggregate: {
            args: Prisma.TestFileAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTestFile>
          }
          groupBy: {
            args: Prisma.TestFileGroupByArgs<ExtArgs>
            result: $Utils.Optional<TestFileGroupByOutputType>[]
          }
          count: {
            args: Prisma.TestFileCountArgs<ExtArgs>
            result: $Utils.Optional<TestFileCountAggregateOutputType> | number
          }
        }
      }
      TestAnalysis: {
        payload: Prisma.$TestAnalysisPayload<ExtArgs>
        fields: Prisma.TestAnalysisFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TestAnalysisFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestAnalysisPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TestAnalysisFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestAnalysisPayload>
          }
          findFirst: {
            args: Prisma.TestAnalysisFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestAnalysisPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TestAnalysisFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestAnalysisPayload>
          }
          findMany: {
            args: Prisma.TestAnalysisFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestAnalysisPayload>[]
          }
          create: {
            args: Prisma.TestAnalysisCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestAnalysisPayload>
          }
          createMany: {
            args: Prisma.TestAnalysisCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TestAnalysisCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestAnalysisPayload>[]
          }
          delete: {
            args: Prisma.TestAnalysisDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestAnalysisPayload>
          }
          update: {
            args: Prisma.TestAnalysisUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestAnalysisPayload>
          }
          deleteMany: {
            args: Prisma.TestAnalysisDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TestAnalysisUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TestAnalysisUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestAnalysisPayload>
          }
          aggregate: {
            args: Prisma.TestAnalysisAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTestAnalysis>
          }
          groupBy: {
            args: Prisma.TestAnalysisGroupByArgs<ExtArgs>
            result: $Utils.Optional<TestAnalysisGroupByOutputType>[]
          }
          count: {
            args: Prisma.TestAnalysisCountArgs<ExtArgs>
            result: $Utils.Optional<TestAnalysisCountAggregateOutputType> | number
          }
        }
      }
      TestPattern: {
        payload: Prisma.$TestPatternPayload<ExtArgs>
        fields: Prisma.TestPatternFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TestPatternFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestPatternPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TestPatternFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestPatternPayload>
          }
          findFirst: {
            args: Prisma.TestPatternFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestPatternPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TestPatternFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestPatternPayload>
          }
          findMany: {
            args: Prisma.TestPatternFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestPatternPayload>[]
          }
          create: {
            args: Prisma.TestPatternCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestPatternPayload>
          }
          createMany: {
            args: Prisma.TestPatternCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TestPatternCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestPatternPayload>[]
          }
          delete: {
            args: Prisma.TestPatternDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestPatternPayload>
          }
          update: {
            args: Prisma.TestPatternUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestPatternPayload>
          }
          deleteMany: {
            args: Prisma.TestPatternDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TestPatternUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TestPatternUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestPatternPayload>
          }
          aggregate: {
            args: Prisma.TestPatternAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTestPattern>
          }
          groupBy: {
            args: Prisma.TestPatternGroupByArgs<ExtArgs>
            result: $Utils.Optional<TestPatternGroupByOutputType>[]
          }
          count: {
            args: Prisma.TestPatternCountArgs<ExtArgs>
            result: $Utils.Optional<TestPatternCountAggregateOutputType> | number
          }
        }
      }
      FixPattern: {
        payload: Prisma.$FixPatternPayload<ExtArgs>
        fields: Prisma.FixPatternFieldRefs
        operations: {
          findUnique: {
            args: Prisma.FixPatternFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FixPatternPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.FixPatternFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FixPatternPayload>
          }
          findFirst: {
            args: Prisma.FixPatternFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FixPatternPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.FixPatternFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FixPatternPayload>
          }
          findMany: {
            args: Prisma.FixPatternFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FixPatternPayload>[]
          }
          create: {
            args: Prisma.FixPatternCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FixPatternPayload>
          }
          createMany: {
            args: Prisma.FixPatternCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.FixPatternCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FixPatternPayload>[]
          }
          delete: {
            args: Prisma.FixPatternDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FixPatternPayload>
          }
          update: {
            args: Prisma.FixPatternUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FixPatternPayload>
          }
          deleteMany: {
            args: Prisma.FixPatternDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.FixPatternUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.FixPatternUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FixPatternPayload>
          }
          aggregate: {
            args: Prisma.FixPatternAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFixPattern>
          }
          groupBy: {
            args: Prisma.FixPatternGroupByArgs<ExtArgs>
            result: $Utils.Optional<FixPatternGroupByOutputType>[]
          }
          count: {
            args: Prisma.FixPatternCountArgs<ExtArgs>
            result: $Utils.Optional<FixPatternCountAggregateOutputType> | number
          }
        }
      }
      TestExecution: {
        payload: Prisma.$TestExecutionPayload<ExtArgs>
        fields: Prisma.TestExecutionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TestExecutionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestExecutionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TestExecutionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestExecutionPayload>
          }
          findFirst: {
            args: Prisma.TestExecutionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestExecutionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TestExecutionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestExecutionPayload>
          }
          findMany: {
            args: Prisma.TestExecutionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestExecutionPayload>[]
          }
          create: {
            args: Prisma.TestExecutionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestExecutionPayload>
          }
          createMany: {
            args: Prisma.TestExecutionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TestExecutionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestExecutionPayload>[]
          }
          delete: {
            args: Prisma.TestExecutionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestExecutionPayload>
          }
          update: {
            args: Prisma.TestExecutionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestExecutionPayload>
          }
          deleteMany: {
            args: Prisma.TestExecutionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TestExecutionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TestExecutionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestExecutionPayload>
          }
          aggregate: {
            args: Prisma.TestExecutionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTestExecution>
          }
          groupBy: {
            args: Prisma.TestExecutionGroupByArgs<ExtArgs>
            result: $Utils.Optional<TestExecutionGroupByOutputType>[]
          }
          count: {
            args: Prisma.TestExecutionCountArgs<ExtArgs>
            result: $Utils.Optional<TestExecutionCountAggregateOutputType> | number
          }
        }
      }
      TestCoverage: {
        payload: Prisma.$TestCoveragePayload<ExtArgs>
        fields: Prisma.TestCoverageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TestCoverageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestCoveragePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TestCoverageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestCoveragePayload>
          }
          findFirst: {
            args: Prisma.TestCoverageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestCoveragePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TestCoverageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestCoveragePayload>
          }
          findMany: {
            args: Prisma.TestCoverageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestCoveragePayload>[]
          }
          create: {
            args: Prisma.TestCoverageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestCoveragePayload>
          }
          createMany: {
            args: Prisma.TestCoverageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TestCoverageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestCoveragePayload>[]
          }
          delete: {
            args: Prisma.TestCoverageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestCoveragePayload>
          }
          update: {
            args: Prisma.TestCoverageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestCoveragePayload>
          }
          deleteMany: {
            args: Prisma.TestCoverageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TestCoverageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TestCoverageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestCoveragePayload>
          }
          aggregate: {
            args: Prisma.TestCoverageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTestCoverage>
          }
          groupBy: {
            args: Prisma.TestCoverageGroupByArgs<ExtArgs>
            result: $Utils.Optional<TestCoverageGroupByOutputType>[]
          }
          count: {
            args: Prisma.TestCoverageCountArgs<ExtArgs>
            result: $Utils.Optional<TestCoverageCountAggregateOutputType> | number
          }
        }
      }
      TestFix: {
        payload: Prisma.$TestFixPayload<ExtArgs>
        fields: Prisma.TestFixFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TestFixFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestFixPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TestFixFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestFixPayload>
          }
          findFirst: {
            args: Prisma.TestFixFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestFixPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TestFixFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestFixPayload>
          }
          findMany: {
            args: Prisma.TestFixFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestFixPayload>[]
          }
          create: {
            args: Prisma.TestFixCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestFixPayload>
          }
          createMany: {
            args: Prisma.TestFixCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TestFixCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestFixPayload>[]
          }
          delete: {
            args: Prisma.TestFixDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestFixPayload>
          }
          update: {
            args: Prisma.TestFixUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestFixPayload>
          }
          deleteMany: {
            args: Prisma.TestFixDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TestFixUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TestFixUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestFixPayload>
          }
          aggregate: {
            args: Prisma.TestFixAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTestFix>
          }
          groupBy: {
            args: Prisma.TestFixGroupByArgs<ExtArgs>
            result: $Utils.Optional<TestFixGroupByOutputType>[]
          }
          count: {
            args: Prisma.TestFixCountArgs<ExtArgs>
            result: $Utils.Optional<TestFixCountAggregateOutputType> | number
          }
        }
      }
      TestGeneration: {
        payload: Prisma.$TestGenerationPayload<ExtArgs>
        fields: Prisma.TestGenerationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TestGenerationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestGenerationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TestGenerationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestGenerationPayload>
          }
          findFirst: {
            args: Prisma.TestGenerationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestGenerationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TestGenerationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestGenerationPayload>
          }
          findMany: {
            args: Prisma.TestGenerationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestGenerationPayload>[]
          }
          create: {
            args: Prisma.TestGenerationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestGenerationPayload>
          }
          createMany: {
            args: Prisma.TestGenerationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TestGenerationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestGenerationPayload>[]
          }
          delete: {
            args: Prisma.TestGenerationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestGenerationPayload>
          }
          update: {
            args: Prisma.TestGenerationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestGenerationPayload>
          }
          deleteMany: {
            args: Prisma.TestGenerationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TestGenerationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TestGenerationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestGenerationPayload>
          }
          aggregate: {
            args: Prisma.TestGenerationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTestGeneration>
          }
          groupBy: {
            args: Prisma.TestGenerationGroupByArgs<ExtArgs>
            result: $Utils.Optional<TestGenerationGroupByOutputType>[]
          }
          count: {
            args: Prisma.TestGenerationCountArgs<ExtArgs>
            result: $Utils.Optional<TestGenerationCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
  }


  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type AnalysisSessionCountOutputType
   */

  export type AnalysisSessionCountOutputType = {
    testFiles: number
    analyses: number
  }

  export type AnalysisSessionCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    testFiles?: boolean | AnalysisSessionCountOutputTypeCountTestFilesArgs
    analyses?: boolean | AnalysisSessionCountOutputTypeCountAnalysesArgs
  }

  // Custom InputTypes
  /**
   * AnalysisSessionCountOutputType without action
   */
  export type AnalysisSessionCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AnalysisSessionCountOutputType
     */
    select?: AnalysisSessionCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * AnalysisSessionCountOutputType without action
   */
  export type AnalysisSessionCountOutputTypeCountTestFilesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TestFileWhereInput
  }

  /**
   * AnalysisSessionCountOutputType without action
   */
  export type AnalysisSessionCountOutputTypeCountAnalysesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TestAnalysisWhereInput
  }


  /**
   * Count Type TestFileCountOutputType
   */

  export type TestFileCountOutputType = {
    sessions: number
    executions: number
    coverage: number
    fixes: number
    generations: number
    analyses: number
  }

  export type TestFileCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sessions?: boolean | TestFileCountOutputTypeCountSessionsArgs
    executions?: boolean | TestFileCountOutputTypeCountExecutionsArgs
    coverage?: boolean | TestFileCountOutputTypeCountCoverageArgs
    fixes?: boolean | TestFileCountOutputTypeCountFixesArgs
    generations?: boolean | TestFileCountOutputTypeCountGenerationsArgs
    analyses?: boolean | TestFileCountOutputTypeCountAnalysesArgs
  }

  // Custom InputTypes
  /**
   * TestFileCountOutputType without action
   */
  export type TestFileCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestFileCountOutputType
     */
    select?: TestFileCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * TestFileCountOutputType without action
   */
  export type TestFileCountOutputTypeCountSessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AnalysisSessionWhereInput
  }

  /**
   * TestFileCountOutputType without action
   */
  export type TestFileCountOutputTypeCountExecutionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TestExecutionWhereInput
  }

  /**
   * TestFileCountOutputType without action
   */
  export type TestFileCountOutputTypeCountCoverageArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TestCoverageWhereInput
  }

  /**
   * TestFileCountOutputType without action
   */
  export type TestFileCountOutputTypeCountFixesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TestFixWhereInput
  }

  /**
   * TestFileCountOutputType without action
   */
  export type TestFileCountOutputTypeCountGenerationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TestGenerationWhereInput
  }

  /**
   * TestFileCountOutputType without action
   */
  export type TestFileCountOutputTypeCountAnalysesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TestAnalysisWhereInput
  }


  /**
   * Models
   */

  /**
   * Model AnalysisSession
   */

  export type AggregateAnalysisSession = {
    _count: AnalysisSessionCountAggregateOutputType | null
    _min: AnalysisSessionMinAggregateOutputType | null
    _max: AnalysisSessionMaxAggregateOutputType | null
  }

  export type AnalysisSessionMinAggregateOutputType = {
    id: string | null
    startedAt: Date | null
    endedAt: Date | null
    status: $Enums.SessionStatus | null
  }

  export type AnalysisSessionMaxAggregateOutputType = {
    id: string | null
    startedAt: Date | null
    endedAt: Date | null
    status: $Enums.SessionStatus | null
  }

  export type AnalysisSessionCountAggregateOutputType = {
    id: number
    startedAt: number
    endedAt: number
    status: number
    context: number
    decisions: number
    operations: number
    _all: number
  }


  export type AnalysisSessionMinAggregateInputType = {
    id?: true
    startedAt?: true
    endedAt?: true
    status?: true
  }

  export type AnalysisSessionMaxAggregateInputType = {
    id?: true
    startedAt?: true
    endedAt?: true
    status?: true
  }

  export type AnalysisSessionCountAggregateInputType = {
    id?: true
    startedAt?: true
    endedAt?: true
    status?: true
    context?: true
    decisions?: true
    operations?: true
    _all?: true
  }

  export type AnalysisSessionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AnalysisSession to aggregate.
     */
    where?: AnalysisSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AnalysisSessions to fetch.
     */
    orderBy?: AnalysisSessionOrderByWithRelationInput | AnalysisSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AnalysisSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AnalysisSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AnalysisSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AnalysisSessions
    **/
    _count?: true | AnalysisSessionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AnalysisSessionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AnalysisSessionMaxAggregateInputType
  }

  export type GetAnalysisSessionAggregateType<T extends AnalysisSessionAggregateArgs> = {
        [P in keyof T & keyof AggregateAnalysisSession]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAnalysisSession[P]>
      : GetScalarType<T[P], AggregateAnalysisSession[P]>
  }




  export type AnalysisSessionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AnalysisSessionWhereInput
    orderBy?: AnalysisSessionOrderByWithAggregationInput | AnalysisSessionOrderByWithAggregationInput[]
    by: AnalysisSessionScalarFieldEnum[] | AnalysisSessionScalarFieldEnum
    having?: AnalysisSessionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AnalysisSessionCountAggregateInputType | true
    _min?: AnalysisSessionMinAggregateInputType
    _max?: AnalysisSessionMaxAggregateInputType
  }

  export type AnalysisSessionGroupByOutputType = {
    id: string
    startedAt: Date
    endedAt: Date | null
    status: $Enums.SessionStatus
    context: JsonValue | null
    decisions: JsonValue[]
    operations: JsonValue[]
    _count: AnalysisSessionCountAggregateOutputType | null
    _min: AnalysisSessionMinAggregateOutputType | null
    _max: AnalysisSessionMaxAggregateOutputType | null
  }

  type GetAnalysisSessionGroupByPayload<T extends AnalysisSessionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AnalysisSessionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AnalysisSessionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AnalysisSessionGroupByOutputType[P]>
            : GetScalarType<T[P], AnalysisSessionGroupByOutputType[P]>
        }
      >
    >


  export type AnalysisSessionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    startedAt?: boolean
    endedAt?: boolean
    status?: boolean
    context?: boolean
    decisions?: boolean
    operations?: boolean
    testFiles?: boolean | AnalysisSession$testFilesArgs<ExtArgs>
    analyses?: boolean | AnalysisSession$analysesArgs<ExtArgs>
    _count?: boolean | AnalysisSessionCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["analysisSession"]>

  export type AnalysisSessionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    startedAt?: boolean
    endedAt?: boolean
    status?: boolean
    context?: boolean
    decisions?: boolean
    operations?: boolean
  }, ExtArgs["result"]["analysisSession"]>

  export type AnalysisSessionSelectScalar = {
    id?: boolean
    startedAt?: boolean
    endedAt?: boolean
    status?: boolean
    context?: boolean
    decisions?: boolean
    operations?: boolean
  }

  export type AnalysisSessionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    testFiles?: boolean | AnalysisSession$testFilesArgs<ExtArgs>
    analyses?: boolean | AnalysisSession$analysesArgs<ExtArgs>
    _count?: boolean | AnalysisSessionCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type AnalysisSessionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $AnalysisSessionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AnalysisSession"
    objects: {
      testFiles: Prisma.$TestFilePayload<ExtArgs>[]
      analyses: Prisma.$TestAnalysisPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      startedAt: Date
      endedAt: Date | null
      status: $Enums.SessionStatus
      context: Prisma.JsonValue | null
      decisions: Prisma.JsonValue[]
      operations: Prisma.JsonValue[]
    }, ExtArgs["result"]["analysisSession"]>
    composites: {}
  }

  type AnalysisSessionGetPayload<S extends boolean | null | undefined | AnalysisSessionDefaultArgs> = $Result.GetResult<Prisma.$AnalysisSessionPayload, S>

  type AnalysisSessionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<AnalysisSessionFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: AnalysisSessionCountAggregateInputType | true
    }

  export interface AnalysisSessionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AnalysisSession'], meta: { name: 'AnalysisSession' } }
    /**
     * Find zero or one AnalysisSession that matches the filter.
     * @param {AnalysisSessionFindUniqueArgs} args - Arguments to find a AnalysisSession
     * @example
     * // Get one AnalysisSession
     * const analysisSession = await prisma.analysisSession.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AnalysisSessionFindUniqueArgs>(args: SelectSubset<T, AnalysisSessionFindUniqueArgs<ExtArgs>>): Prisma__AnalysisSessionClient<$Result.GetResult<Prisma.$AnalysisSessionPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one AnalysisSession that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {AnalysisSessionFindUniqueOrThrowArgs} args - Arguments to find a AnalysisSession
     * @example
     * // Get one AnalysisSession
     * const analysisSession = await prisma.analysisSession.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AnalysisSessionFindUniqueOrThrowArgs>(args: SelectSubset<T, AnalysisSessionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AnalysisSessionClient<$Result.GetResult<Prisma.$AnalysisSessionPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first AnalysisSession that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AnalysisSessionFindFirstArgs} args - Arguments to find a AnalysisSession
     * @example
     * // Get one AnalysisSession
     * const analysisSession = await prisma.analysisSession.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AnalysisSessionFindFirstArgs>(args?: SelectSubset<T, AnalysisSessionFindFirstArgs<ExtArgs>>): Prisma__AnalysisSessionClient<$Result.GetResult<Prisma.$AnalysisSessionPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first AnalysisSession that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AnalysisSessionFindFirstOrThrowArgs} args - Arguments to find a AnalysisSession
     * @example
     * // Get one AnalysisSession
     * const analysisSession = await prisma.analysisSession.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AnalysisSessionFindFirstOrThrowArgs>(args?: SelectSubset<T, AnalysisSessionFindFirstOrThrowArgs<ExtArgs>>): Prisma__AnalysisSessionClient<$Result.GetResult<Prisma.$AnalysisSessionPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more AnalysisSessions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AnalysisSessionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AnalysisSessions
     * const analysisSessions = await prisma.analysisSession.findMany()
     * 
     * // Get first 10 AnalysisSessions
     * const analysisSessions = await prisma.analysisSession.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const analysisSessionWithIdOnly = await prisma.analysisSession.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AnalysisSessionFindManyArgs>(args?: SelectSubset<T, AnalysisSessionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AnalysisSessionPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a AnalysisSession.
     * @param {AnalysisSessionCreateArgs} args - Arguments to create a AnalysisSession.
     * @example
     * // Create one AnalysisSession
     * const AnalysisSession = await prisma.analysisSession.create({
     *   data: {
     *     // ... data to create a AnalysisSession
     *   }
     * })
     * 
     */
    create<T extends AnalysisSessionCreateArgs>(args: SelectSubset<T, AnalysisSessionCreateArgs<ExtArgs>>): Prisma__AnalysisSessionClient<$Result.GetResult<Prisma.$AnalysisSessionPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many AnalysisSessions.
     * @param {AnalysisSessionCreateManyArgs} args - Arguments to create many AnalysisSessions.
     * @example
     * // Create many AnalysisSessions
     * const analysisSession = await prisma.analysisSession.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AnalysisSessionCreateManyArgs>(args?: SelectSubset<T, AnalysisSessionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AnalysisSessions and returns the data saved in the database.
     * @param {AnalysisSessionCreateManyAndReturnArgs} args - Arguments to create many AnalysisSessions.
     * @example
     * // Create many AnalysisSessions
     * const analysisSession = await prisma.analysisSession.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AnalysisSessions and only return the `id`
     * const analysisSessionWithIdOnly = await prisma.analysisSession.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AnalysisSessionCreateManyAndReturnArgs>(args?: SelectSubset<T, AnalysisSessionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AnalysisSessionPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a AnalysisSession.
     * @param {AnalysisSessionDeleteArgs} args - Arguments to delete one AnalysisSession.
     * @example
     * // Delete one AnalysisSession
     * const AnalysisSession = await prisma.analysisSession.delete({
     *   where: {
     *     // ... filter to delete one AnalysisSession
     *   }
     * })
     * 
     */
    delete<T extends AnalysisSessionDeleteArgs>(args: SelectSubset<T, AnalysisSessionDeleteArgs<ExtArgs>>): Prisma__AnalysisSessionClient<$Result.GetResult<Prisma.$AnalysisSessionPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one AnalysisSession.
     * @param {AnalysisSessionUpdateArgs} args - Arguments to update one AnalysisSession.
     * @example
     * // Update one AnalysisSession
     * const analysisSession = await prisma.analysisSession.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AnalysisSessionUpdateArgs>(args: SelectSubset<T, AnalysisSessionUpdateArgs<ExtArgs>>): Prisma__AnalysisSessionClient<$Result.GetResult<Prisma.$AnalysisSessionPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more AnalysisSessions.
     * @param {AnalysisSessionDeleteManyArgs} args - Arguments to filter AnalysisSessions to delete.
     * @example
     * // Delete a few AnalysisSessions
     * const { count } = await prisma.analysisSession.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AnalysisSessionDeleteManyArgs>(args?: SelectSubset<T, AnalysisSessionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AnalysisSessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AnalysisSessionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AnalysisSessions
     * const analysisSession = await prisma.analysisSession.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AnalysisSessionUpdateManyArgs>(args: SelectSubset<T, AnalysisSessionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one AnalysisSession.
     * @param {AnalysisSessionUpsertArgs} args - Arguments to update or create a AnalysisSession.
     * @example
     * // Update or create a AnalysisSession
     * const analysisSession = await prisma.analysisSession.upsert({
     *   create: {
     *     // ... data to create a AnalysisSession
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AnalysisSession we want to update
     *   }
     * })
     */
    upsert<T extends AnalysisSessionUpsertArgs>(args: SelectSubset<T, AnalysisSessionUpsertArgs<ExtArgs>>): Prisma__AnalysisSessionClient<$Result.GetResult<Prisma.$AnalysisSessionPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of AnalysisSessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AnalysisSessionCountArgs} args - Arguments to filter AnalysisSessions to count.
     * @example
     * // Count the number of AnalysisSessions
     * const count = await prisma.analysisSession.count({
     *   where: {
     *     // ... the filter for the AnalysisSessions we want to count
     *   }
     * })
    **/
    count<T extends AnalysisSessionCountArgs>(
      args?: Subset<T, AnalysisSessionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AnalysisSessionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AnalysisSession.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AnalysisSessionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AnalysisSessionAggregateArgs>(args: Subset<T, AnalysisSessionAggregateArgs>): Prisma.PrismaPromise<GetAnalysisSessionAggregateType<T>>

    /**
     * Group by AnalysisSession.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AnalysisSessionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AnalysisSessionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AnalysisSessionGroupByArgs['orderBy'] }
        : { orderBy?: AnalysisSessionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AnalysisSessionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAnalysisSessionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AnalysisSession model
   */
  readonly fields: AnalysisSessionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AnalysisSession.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AnalysisSessionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    testFiles<T extends AnalysisSession$testFilesArgs<ExtArgs> = {}>(args?: Subset<T, AnalysisSession$testFilesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TestFilePayload<ExtArgs>, T, "findMany"> | Null>
    analyses<T extends AnalysisSession$analysesArgs<ExtArgs> = {}>(args?: Subset<T, AnalysisSession$analysesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TestAnalysisPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AnalysisSession model
   */ 
  interface AnalysisSessionFieldRefs {
    readonly id: FieldRef<"AnalysisSession", 'String'>
    readonly startedAt: FieldRef<"AnalysisSession", 'DateTime'>
    readonly endedAt: FieldRef<"AnalysisSession", 'DateTime'>
    readonly status: FieldRef<"AnalysisSession", 'SessionStatus'>
    readonly context: FieldRef<"AnalysisSession", 'Json'>
    readonly decisions: FieldRef<"AnalysisSession", 'Json[]'>
    readonly operations: FieldRef<"AnalysisSession", 'Json[]'>
  }
    

  // Custom InputTypes
  /**
   * AnalysisSession findUnique
   */
  export type AnalysisSessionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AnalysisSession
     */
    select?: AnalysisSessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnalysisSessionInclude<ExtArgs> | null
    /**
     * Filter, which AnalysisSession to fetch.
     */
    where: AnalysisSessionWhereUniqueInput
  }

  /**
   * AnalysisSession findUniqueOrThrow
   */
  export type AnalysisSessionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AnalysisSession
     */
    select?: AnalysisSessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnalysisSessionInclude<ExtArgs> | null
    /**
     * Filter, which AnalysisSession to fetch.
     */
    where: AnalysisSessionWhereUniqueInput
  }

  /**
   * AnalysisSession findFirst
   */
  export type AnalysisSessionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AnalysisSession
     */
    select?: AnalysisSessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnalysisSessionInclude<ExtArgs> | null
    /**
     * Filter, which AnalysisSession to fetch.
     */
    where?: AnalysisSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AnalysisSessions to fetch.
     */
    orderBy?: AnalysisSessionOrderByWithRelationInput | AnalysisSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AnalysisSessions.
     */
    cursor?: AnalysisSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AnalysisSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AnalysisSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AnalysisSessions.
     */
    distinct?: AnalysisSessionScalarFieldEnum | AnalysisSessionScalarFieldEnum[]
  }

  /**
   * AnalysisSession findFirstOrThrow
   */
  export type AnalysisSessionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AnalysisSession
     */
    select?: AnalysisSessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnalysisSessionInclude<ExtArgs> | null
    /**
     * Filter, which AnalysisSession to fetch.
     */
    where?: AnalysisSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AnalysisSessions to fetch.
     */
    orderBy?: AnalysisSessionOrderByWithRelationInput | AnalysisSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AnalysisSessions.
     */
    cursor?: AnalysisSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AnalysisSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AnalysisSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AnalysisSessions.
     */
    distinct?: AnalysisSessionScalarFieldEnum | AnalysisSessionScalarFieldEnum[]
  }

  /**
   * AnalysisSession findMany
   */
  export type AnalysisSessionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AnalysisSession
     */
    select?: AnalysisSessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnalysisSessionInclude<ExtArgs> | null
    /**
     * Filter, which AnalysisSessions to fetch.
     */
    where?: AnalysisSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AnalysisSessions to fetch.
     */
    orderBy?: AnalysisSessionOrderByWithRelationInput | AnalysisSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AnalysisSessions.
     */
    cursor?: AnalysisSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AnalysisSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AnalysisSessions.
     */
    skip?: number
    distinct?: AnalysisSessionScalarFieldEnum | AnalysisSessionScalarFieldEnum[]
  }

  /**
   * AnalysisSession create
   */
  export type AnalysisSessionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AnalysisSession
     */
    select?: AnalysisSessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnalysisSessionInclude<ExtArgs> | null
    /**
     * The data needed to create a AnalysisSession.
     */
    data?: XOR<AnalysisSessionCreateInput, AnalysisSessionUncheckedCreateInput>
  }

  /**
   * AnalysisSession createMany
   */
  export type AnalysisSessionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AnalysisSessions.
     */
    data: AnalysisSessionCreateManyInput | AnalysisSessionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AnalysisSession createManyAndReturn
   */
  export type AnalysisSessionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AnalysisSession
     */
    select?: AnalysisSessionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many AnalysisSessions.
     */
    data: AnalysisSessionCreateManyInput | AnalysisSessionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AnalysisSession update
   */
  export type AnalysisSessionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AnalysisSession
     */
    select?: AnalysisSessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnalysisSessionInclude<ExtArgs> | null
    /**
     * The data needed to update a AnalysisSession.
     */
    data: XOR<AnalysisSessionUpdateInput, AnalysisSessionUncheckedUpdateInput>
    /**
     * Choose, which AnalysisSession to update.
     */
    where: AnalysisSessionWhereUniqueInput
  }

  /**
   * AnalysisSession updateMany
   */
  export type AnalysisSessionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AnalysisSessions.
     */
    data: XOR<AnalysisSessionUpdateManyMutationInput, AnalysisSessionUncheckedUpdateManyInput>
    /**
     * Filter which AnalysisSessions to update
     */
    where?: AnalysisSessionWhereInput
  }

  /**
   * AnalysisSession upsert
   */
  export type AnalysisSessionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AnalysisSession
     */
    select?: AnalysisSessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnalysisSessionInclude<ExtArgs> | null
    /**
     * The filter to search for the AnalysisSession to update in case it exists.
     */
    where: AnalysisSessionWhereUniqueInput
    /**
     * In case the AnalysisSession found by the `where` argument doesn't exist, create a new AnalysisSession with this data.
     */
    create: XOR<AnalysisSessionCreateInput, AnalysisSessionUncheckedCreateInput>
    /**
     * In case the AnalysisSession was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AnalysisSessionUpdateInput, AnalysisSessionUncheckedUpdateInput>
  }

  /**
   * AnalysisSession delete
   */
  export type AnalysisSessionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AnalysisSession
     */
    select?: AnalysisSessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnalysisSessionInclude<ExtArgs> | null
    /**
     * Filter which AnalysisSession to delete.
     */
    where: AnalysisSessionWhereUniqueInput
  }

  /**
   * AnalysisSession deleteMany
   */
  export type AnalysisSessionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AnalysisSessions to delete
     */
    where?: AnalysisSessionWhereInput
  }

  /**
   * AnalysisSession.testFiles
   */
  export type AnalysisSession$testFilesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestFile
     */
    select?: TestFileSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestFileInclude<ExtArgs> | null
    where?: TestFileWhereInput
    orderBy?: TestFileOrderByWithRelationInput | TestFileOrderByWithRelationInput[]
    cursor?: TestFileWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TestFileScalarFieldEnum | TestFileScalarFieldEnum[]
  }

  /**
   * AnalysisSession.analyses
   */
  export type AnalysisSession$analysesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestAnalysis
     */
    select?: TestAnalysisSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestAnalysisInclude<ExtArgs> | null
    where?: TestAnalysisWhereInput
    orderBy?: TestAnalysisOrderByWithRelationInput | TestAnalysisOrderByWithRelationInput[]
    cursor?: TestAnalysisWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TestAnalysisScalarFieldEnum | TestAnalysisScalarFieldEnum[]
  }

  /**
   * AnalysisSession without action
   */
  export type AnalysisSessionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AnalysisSession
     */
    select?: AnalysisSessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnalysisSessionInclude<ExtArgs> | null
  }


  /**
   * Model TestFile
   */

  export type AggregateTestFile = {
    _count: TestFileCountAggregateOutputType | null
    _avg: TestFileAvgAggregateOutputType | null
    _sum: TestFileSumAggregateOutputType | null
    _min: TestFileMinAggregateOutputType | null
    _max: TestFileMaxAggregateOutputType | null
  }

  export type TestFileAvgAggregateOutputType = {
    totalRuns: number | null
    avgPassRate: number | null
    currentPassRate: number | null
    avgDuration: number | null
    currentCoverage: number | null
    avgCoverage: number | null
    totalFixes: number | null
    flakyTests: number | null
    totalTests: number | null
    criticalTests: number | null
  }

  export type TestFileSumAggregateOutputType = {
    totalRuns: number | null
    avgPassRate: number | null
    currentPassRate: number | null
    avgDuration: number | null
    currentCoverage: number | null
    avgCoverage: number | null
    totalFixes: number | null
    flakyTests: number | null
    totalTests: number | null
    criticalTests: number | null
  }

  export type TestFileMinAggregateOutputType = {
    id: string | null
    filePath: string | null
    fileName: string | null
    firstSeen: Date | null
    lastUpdated: Date | null
    totalRuns: number | null
    avgPassRate: number | null
    currentPassRate: number | null
    avgDuration: number | null
    currentCoverage: number | null
    avgCoverage: number | null
    totalFixes: number | null
    flakyTests: number | null
    healthScore: $Enums.TestHealthScore | null
    totalTests: number | null
    criticalTests: number | null
    lastFailureReason: string | null
  }

  export type TestFileMaxAggregateOutputType = {
    id: string | null
    filePath: string | null
    fileName: string | null
    firstSeen: Date | null
    lastUpdated: Date | null
    totalRuns: number | null
    avgPassRate: number | null
    currentPassRate: number | null
    avgDuration: number | null
    currentCoverage: number | null
    avgCoverage: number | null
    totalFixes: number | null
    flakyTests: number | null
    healthScore: $Enums.TestHealthScore | null
    totalTests: number | null
    criticalTests: number | null
    lastFailureReason: string | null
  }

  export type TestFileCountAggregateOutputType = {
    id: number
    filePath: number
    fileName: number
    firstSeen: number
    lastUpdated: number
    totalRuns: number
    avgPassRate: number
    currentPassRate: number
    avgDuration: number
    currentCoverage: number
    avgCoverage: number
    totalFixes: number
    flakyTests: number
    metadata: number
    healthScore: number
    totalTests: number
    criticalTests: number
    lastFailureReason: number
    _all: number
  }


  export type TestFileAvgAggregateInputType = {
    totalRuns?: true
    avgPassRate?: true
    currentPassRate?: true
    avgDuration?: true
    currentCoverage?: true
    avgCoverage?: true
    totalFixes?: true
    flakyTests?: true
    totalTests?: true
    criticalTests?: true
  }

  export type TestFileSumAggregateInputType = {
    totalRuns?: true
    avgPassRate?: true
    currentPassRate?: true
    avgDuration?: true
    currentCoverage?: true
    avgCoverage?: true
    totalFixes?: true
    flakyTests?: true
    totalTests?: true
    criticalTests?: true
  }

  export type TestFileMinAggregateInputType = {
    id?: true
    filePath?: true
    fileName?: true
    firstSeen?: true
    lastUpdated?: true
    totalRuns?: true
    avgPassRate?: true
    currentPassRate?: true
    avgDuration?: true
    currentCoverage?: true
    avgCoverage?: true
    totalFixes?: true
    flakyTests?: true
    healthScore?: true
    totalTests?: true
    criticalTests?: true
    lastFailureReason?: true
  }

  export type TestFileMaxAggregateInputType = {
    id?: true
    filePath?: true
    fileName?: true
    firstSeen?: true
    lastUpdated?: true
    totalRuns?: true
    avgPassRate?: true
    currentPassRate?: true
    avgDuration?: true
    currentCoverage?: true
    avgCoverage?: true
    totalFixes?: true
    flakyTests?: true
    healthScore?: true
    totalTests?: true
    criticalTests?: true
    lastFailureReason?: true
  }

  export type TestFileCountAggregateInputType = {
    id?: true
    filePath?: true
    fileName?: true
    firstSeen?: true
    lastUpdated?: true
    totalRuns?: true
    avgPassRate?: true
    currentPassRate?: true
    avgDuration?: true
    currentCoverage?: true
    avgCoverage?: true
    totalFixes?: true
    flakyTests?: true
    metadata?: true
    healthScore?: true
    totalTests?: true
    criticalTests?: true
    lastFailureReason?: true
    _all?: true
  }

  export type TestFileAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TestFile to aggregate.
     */
    where?: TestFileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestFiles to fetch.
     */
    orderBy?: TestFileOrderByWithRelationInput | TestFileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TestFileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestFiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestFiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TestFiles
    **/
    _count?: true | TestFileCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TestFileAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TestFileSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TestFileMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TestFileMaxAggregateInputType
  }

  export type GetTestFileAggregateType<T extends TestFileAggregateArgs> = {
        [P in keyof T & keyof AggregateTestFile]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTestFile[P]>
      : GetScalarType<T[P], AggregateTestFile[P]>
  }




  export type TestFileGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TestFileWhereInput
    orderBy?: TestFileOrderByWithAggregationInput | TestFileOrderByWithAggregationInput[]
    by: TestFileScalarFieldEnum[] | TestFileScalarFieldEnum
    having?: TestFileScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TestFileCountAggregateInputType | true
    _avg?: TestFileAvgAggregateInputType
    _sum?: TestFileSumAggregateInputType
    _min?: TestFileMinAggregateInputType
    _max?: TestFileMaxAggregateInputType
  }

  export type TestFileGroupByOutputType = {
    id: string
    filePath: string
    fileName: string
    firstSeen: Date
    lastUpdated: Date
    totalRuns: number
    avgPassRate: number
    currentPassRate: number
    avgDuration: number
    currentCoverage: number
    avgCoverage: number
    totalFixes: number
    flakyTests: number
    metadata: JsonValue | null
    healthScore: $Enums.TestHealthScore
    totalTests: number
    criticalTests: number
    lastFailureReason: string | null
    _count: TestFileCountAggregateOutputType | null
    _avg: TestFileAvgAggregateOutputType | null
    _sum: TestFileSumAggregateOutputType | null
    _min: TestFileMinAggregateOutputType | null
    _max: TestFileMaxAggregateOutputType | null
  }

  type GetTestFileGroupByPayload<T extends TestFileGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TestFileGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TestFileGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TestFileGroupByOutputType[P]>
            : GetScalarType<T[P], TestFileGroupByOutputType[P]>
        }
      >
    >


  export type TestFileSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    filePath?: boolean
    fileName?: boolean
    firstSeen?: boolean
    lastUpdated?: boolean
    totalRuns?: boolean
    avgPassRate?: boolean
    currentPassRate?: boolean
    avgDuration?: boolean
    currentCoverage?: boolean
    avgCoverage?: boolean
    totalFixes?: boolean
    flakyTests?: boolean
    metadata?: boolean
    healthScore?: boolean
    totalTests?: boolean
    criticalTests?: boolean
    lastFailureReason?: boolean
    sessions?: boolean | TestFile$sessionsArgs<ExtArgs>
    executions?: boolean | TestFile$executionsArgs<ExtArgs>
    coverage?: boolean | TestFile$coverageArgs<ExtArgs>
    fixes?: boolean | TestFile$fixesArgs<ExtArgs>
    generations?: boolean | TestFile$generationsArgs<ExtArgs>
    analyses?: boolean | TestFile$analysesArgs<ExtArgs>
    _count?: boolean | TestFileCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["testFile"]>

  export type TestFileSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    filePath?: boolean
    fileName?: boolean
    firstSeen?: boolean
    lastUpdated?: boolean
    totalRuns?: boolean
    avgPassRate?: boolean
    currentPassRate?: boolean
    avgDuration?: boolean
    currentCoverage?: boolean
    avgCoverage?: boolean
    totalFixes?: boolean
    flakyTests?: boolean
    metadata?: boolean
    healthScore?: boolean
    totalTests?: boolean
    criticalTests?: boolean
    lastFailureReason?: boolean
  }, ExtArgs["result"]["testFile"]>

  export type TestFileSelectScalar = {
    id?: boolean
    filePath?: boolean
    fileName?: boolean
    firstSeen?: boolean
    lastUpdated?: boolean
    totalRuns?: boolean
    avgPassRate?: boolean
    currentPassRate?: boolean
    avgDuration?: boolean
    currentCoverage?: boolean
    avgCoverage?: boolean
    totalFixes?: boolean
    flakyTests?: boolean
    metadata?: boolean
    healthScore?: boolean
    totalTests?: boolean
    criticalTests?: boolean
    lastFailureReason?: boolean
  }

  export type TestFileInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sessions?: boolean | TestFile$sessionsArgs<ExtArgs>
    executions?: boolean | TestFile$executionsArgs<ExtArgs>
    coverage?: boolean | TestFile$coverageArgs<ExtArgs>
    fixes?: boolean | TestFile$fixesArgs<ExtArgs>
    generations?: boolean | TestFile$generationsArgs<ExtArgs>
    analyses?: boolean | TestFile$analysesArgs<ExtArgs>
    _count?: boolean | TestFileCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type TestFileIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $TestFilePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TestFile"
    objects: {
      sessions: Prisma.$AnalysisSessionPayload<ExtArgs>[]
      executions: Prisma.$TestExecutionPayload<ExtArgs>[]
      coverage: Prisma.$TestCoveragePayload<ExtArgs>[]
      fixes: Prisma.$TestFixPayload<ExtArgs>[]
      generations: Prisma.$TestGenerationPayload<ExtArgs>[]
      analyses: Prisma.$TestAnalysisPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      filePath: string
      fileName: string
      firstSeen: Date
      lastUpdated: Date
      totalRuns: number
      avgPassRate: number
      currentPassRate: number
      avgDuration: number
      currentCoverage: number
      avgCoverage: number
      totalFixes: number
      flakyTests: number
      metadata: Prisma.JsonValue | null
      healthScore: $Enums.TestHealthScore
      totalTests: number
      criticalTests: number
      lastFailureReason: string | null
    }, ExtArgs["result"]["testFile"]>
    composites: {}
  }

  type TestFileGetPayload<S extends boolean | null | undefined | TestFileDefaultArgs> = $Result.GetResult<Prisma.$TestFilePayload, S>

  type TestFileCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TestFileFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TestFileCountAggregateInputType | true
    }

  export interface TestFileDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TestFile'], meta: { name: 'TestFile' } }
    /**
     * Find zero or one TestFile that matches the filter.
     * @param {TestFileFindUniqueArgs} args - Arguments to find a TestFile
     * @example
     * // Get one TestFile
     * const testFile = await prisma.testFile.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TestFileFindUniqueArgs>(args: SelectSubset<T, TestFileFindUniqueArgs<ExtArgs>>): Prisma__TestFileClient<$Result.GetResult<Prisma.$TestFilePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one TestFile that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {TestFileFindUniqueOrThrowArgs} args - Arguments to find a TestFile
     * @example
     * // Get one TestFile
     * const testFile = await prisma.testFile.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TestFileFindUniqueOrThrowArgs>(args: SelectSubset<T, TestFileFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TestFileClient<$Result.GetResult<Prisma.$TestFilePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first TestFile that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestFileFindFirstArgs} args - Arguments to find a TestFile
     * @example
     * // Get one TestFile
     * const testFile = await prisma.testFile.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TestFileFindFirstArgs>(args?: SelectSubset<T, TestFileFindFirstArgs<ExtArgs>>): Prisma__TestFileClient<$Result.GetResult<Prisma.$TestFilePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first TestFile that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestFileFindFirstOrThrowArgs} args - Arguments to find a TestFile
     * @example
     * // Get one TestFile
     * const testFile = await prisma.testFile.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TestFileFindFirstOrThrowArgs>(args?: SelectSubset<T, TestFileFindFirstOrThrowArgs<ExtArgs>>): Prisma__TestFileClient<$Result.GetResult<Prisma.$TestFilePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more TestFiles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestFileFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TestFiles
     * const testFiles = await prisma.testFile.findMany()
     * 
     * // Get first 10 TestFiles
     * const testFiles = await prisma.testFile.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const testFileWithIdOnly = await prisma.testFile.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TestFileFindManyArgs>(args?: SelectSubset<T, TestFileFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TestFilePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a TestFile.
     * @param {TestFileCreateArgs} args - Arguments to create a TestFile.
     * @example
     * // Create one TestFile
     * const TestFile = await prisma.testFile.create({
     *   data: {
     *     // ... data to create a TestFile
     *   }
     * })
     * 
     */
    create<T extends TestFileCreateArgs>(args: SelectSubset<T, TestFileCreateArgs<ExtArgs>>): Prisma__TestFileClient<$Result.GetResult<Prisma.$TestFilePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many TestFiles.
     * @param {TestFileCreateManyArgs} args - Arguments to create many TestFiles.
     * @example
     * // Create many TestFiles
     * const testFile = await prisma.testFile.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TestFileCreateManyArgs>(args?: SelectSubset<T, TestFileCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TestFiles and returns the data saved in the database.
     * @param {TestFileCreateManyAndReturnArgs} args - Arguments to create many TestFiles.
     * @example
     * // Create many TestFiles
     * const testFile = await prisma.testFile.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TestFiles and only return the `id`
     * const testFileWithIdOnly = await prisma.testFile.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TestFileCreateManyAndReturnArgs>(args?: SelectSubset<T, TestFileCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TestFilePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a TestFile.
     * @param {TestFileDeleteArgs} args - Arguments to delete one TestFile.
     * @example
     * // Delete one TestFile
     * const TestFile = await prisma.testFile.delete({
     *   where: {
     *     // ... filter to delete one TestFile
     *   }
     * })
     * 
     */
    delete<T extends TestFileDeleteArgs>(args: SelectSubset<T, TestFileDeleteArgs<ExtArgs>>): Prisma__TestFileClient<$Result.GetResult<Prisma.$TestFilePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one TestFile.
     * @param {TestFileUpdateArgs} args - Arguments to update one TestFile.
     * @example
     * // Update one TestFile
     * const testFile = await prisma.testFile.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TestFileUpdateArgs>(args: SelectSubset<T, TestFileUpdateArgs<ExtArgs>>): Prisma__TestFileClient<$Result.GetResult<Prisma.$TestFilePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more TestFiles.
     * @param {TestFileDeleteManyArgs} args - Arguments to filter TestFiles to delete.
     * @example
     * // Delete a few TestFiles
     * const { count } = await prisma.testFile.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TestFileDeleteManyArgs>(args?: SelectSubset<T, TestFileDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TestFiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestFileUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TestFiles
     * const testFile = await prisma.testFile.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TestFileUpdateManyArgs>(args: SelectSubset<T, TestFileUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one TestFile.
     * @param {TestFileUpsertArgs} args - Arguments to update or create a TestFile.
     * @example
     * // Update or create a TestFile
     * const testFile = await prisma.testFile.upsert({
     *   create: {
     *     // ... data to create a TestFile
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TestFile we want to update
     *   }
     * })
     */
    upsert<T extends TestFileUpsertArgs>(args: SelectSubset<T, TestFileUpsertArgs<ExtArgs>>): Prisma__TestFileClient<$Result.GetResult<Prisma.$TestFilePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of TestFiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestFileCountArgs} args - Arguments to filter TestFiles to count.
     * @example
     * // Count the number of TestFiles
     * const count = await prisma.testFile.count({
     *   where: {
     *     // ... the filter for the TestFiles we want to count
     *   }
     * })
    **/
    count<T extends TestFileCountArgs>(
      args?: Subset<T, TestFileCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TestFileCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TestFile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestFileAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TestFileAggregateArgs>(args: Subset<T, TestFileAggregateArgs>): Prisma.PrismaPromise<GetTestFileAggregateType<T>>

    /**
     * Group by TestFile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestFileGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TestFileGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TestFileGroupByArgs['orderBy'] }
        : { orderBy?: TestFileGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TestFileGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTestFileGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TestFile model
   */
  readonly fields: TestFileFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TestFile.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TestFileClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    sessions<T extends TestFile$sessionsArgs<ExtArgs> = {}>(args?: Subset<T, TestFile$sessionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AnalysisSessionPayload<ExtArgs>, T, "findMany"> | Null>
    executions<T extends TestFile$executionsArgs<ExtArgs> = {}>(args?: Subset<T, TestFile$executionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TestExecutionPayload<ExtArgs>, T, "findMany"> | Null>
    coverage<T extends TestFile$coverageArgs<ExtArgs> = {}>(args?: Subset<T, TestFile$coverageArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TestCoveragePayload<ExtArgs>, T, "findMany"> | Null>
    fixes<T extends TestFile$fixesArgs<ExtArgs> = {}>(args?: Subset<T, TestFile$fixesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TestFixPayload<ExtArgs>, T, "findMany"> | Null>
    generations<T extends TestFile$generationsArgs<ExtArgs> = {}>(args?: Subset<T, TestFile$generationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TestGenerationPayload<ExtArgs>, T, "findMany"> | Null>
    analyses<T extends TestFile$analysesArgs<ExtArgs> = {}>(args?: Subset<T, TestFile$analysesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TestAnalysisPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TestFile model
   */ 
  interface TestFileFieldRefs {
    readonly id: FieldRef<"TestFile", 'String'>
    readonly filePath: FieldRef<"TestFile", 'String'>
    readonly fileName: FieldRef<"TestFile", 'String'>
    readonly firstSeen: FieldRef<"TestFile", 'DateTime'>
    readonly lastUpdated: FieldRef<"TestFile", 'DateTime'>
    readonly totalRuns: FieldRef<"TestFile", 'Int'>
    readonly avgPassRate: FieldRef<"TestFile", 'Float'>
    readonly currentPassRate: FieldRef<"TestFile", 'Float'>
    readonly avgDuration: FieldRef<"TestFile", 'Float'>
    readonly currentCoverage: FieldRef<"TestFile", 'Float'>
    readonly avgCoverage: FieldRef<"TestFile", 'Float'>
    readonly totalFixes: FieldRef<"TestFile", 'Int'>
    readonly flakyTests: FieldRef<"TestFile", 'Int'>
    readonly metadata: FieldRef<"TestFile", 'Json'>
    readonly healthScore: FieldRef<"TestFile", 'TestHealthScore'>
    readonly totalTests: FieldRef<"TestFile", 'Int'>
    readonly criticalTests: FieldRef<"TestFile", 'Int'>
    readonly lastFailureReason: FieldRef<"TestFile", 'String'>
  }
    

  // Custom InputTypes
  /**
   * TestFile findUnique
   */
  export type TestFileFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestFile
     */
    select?: TestFileSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestFileInclude<ExtArgs> | null
    /**
     * Filter, which TestFile to fetch.
     */
    where: TestFileWhereUniqueInput
  }

  /**
   * TestFile findUniqueOrThrow
   */
  export type TestFileFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestFile
     */
    select?: TestFileSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestFileInclude<ExtArgs> | null
    /**
     * Filter, which TestFile to fetch.
     */
    where: TestFileWhereUniqueInput
  }

  /**
   * TestFile findFirst
   */
  export type TestFileFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestFile
     */
    select?: TestFileSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestFileInclude<ExtArgs> | null
    /**
     * Filter, which TestFile to fetch.
     */
    where?: TestFileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestFiles to fetch.
     */
    orderBy?: TestFileOrderByWithRelationInput | TestFileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TestFiles.
     */
    cursor?: TestFileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestFiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestFiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TestFiles.
     */
    distinct?: TestFileScalarFieldEnum | TestFileScalarFieldEnum[]
  }

  /**
   * TestFile findFirstOrThrow
   */
  export type TestFileFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestFile
     */
    select?: TestFileSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestFileInclude<ExtArgs> | null
    /**
     * Filter, which TestFile to fetch.
     */
    where?: TestFileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestFiles to fetch.
     */
    orderBy?: TestFileOrderByWithRelationInput | TestFileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TestFiles.
     */
    cursor?: TestFileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestFiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestFiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TestFiles.
     */
    distinct?: TestFileScalarFieldEnum | TestFileScalarFieldEnum[]
  }

  /**
   * TestFile findMany
   */
  export type TestFileFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestFile
     */
    select?: TestFileSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestFileInclude<ExtArgs> | null
    /**
     * Filter, which TestFiles to fetch.
     */
    where?: TestFileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestFiles to fetch.
     */
    orderBy?: TestFileOrderByWithRelationInput | TestFileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TestFiles.
     */
    cursor?: TestFileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestFiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestFiles.
     */
    skip?: number
    distinct?: TestFileScalarFieldEnum | TestFileScalarFieldEnum[]
  }

  /**
   * TestFile create
   */
  export type TestFileCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestFile
     */
    select?: TestFileSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestFileInclude<ExtArgs> | null
    /**
     * The data needed to create a TestFile.
     */
    data: XOR<TestFileCreateInput, TestFileUncheckedCreateInput>
  }

  /**
   * TestFile createMany
   */
  export type TestFileCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TestFiles.
     */
    data: TestFileCreateManyInput | TestFileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TestFile createManyAndReturn
   */
  export type TestFileCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestFile
     */
    select?: TestFileSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many TestFiles.
     */
    data: TestFileCreateManyInput | TestFileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TestFile update
   */
  export type TestFileUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestFile
     */
    select?: TestFileSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestFileInclude<ExtArgs> | null
    /**
     * The data needed to update a TestFile.
     */
    data: XOR<TestFileUpdateInput, TestFileUncheckedUpdateInput>
    /**
     * Choose, which TestFile to update.
     */
    where: TestFileWhereUniqueInput
  }

  /**
   * TestFile updateMany
   */
  export type TestFileUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TestFiles.
     */
    data: XOR<TestFileUpdateManyMutationInput, TestFileUncheckedUpdateManyInput>
    /**
     * Filter which TestFiles to update
     */
    where?: TestFileWhereInput
  }

  /**
   * TestFile upsert
   */
  export type TestFileUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestFile
     */
    select?: TestFileSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestFileInclude<ExtArgs> | null
    /**
     * The filter to search for the TestFile to update in case it exists.
     */
    where: TestFileWhereUniqueInput
    /**
     * In case the TestFile found by the `where` argument doesn't exist, create a new TestFile with this data.
     */
    create: XOR<TestFileCreateInput, TestFileUncheckedCreateInput>
    /**
     * In case the TestFile was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TestFileUpdateInput, TestFileUncheckedUpdateInput>
  }

  /**
   * TestFile delete
   */
  export type TestFileDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestFile
     */
    select?: TestFileSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestFileInclude<ExtArgs> | null
    /**
     * Filter which TestFile to delete.
     */
    where: TestFileWhereUniqueInput
  }

  /**
   * TestFile deleteMany
   */
  export type TestFileDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TestFiles to delete
     */
    where?: TestFileWhereInput
  }

  /**
   * TestFile.sessions
   */
  export type TestFile$sessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AnalysisSession
     */
    select?: AnalysisSessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnalysisSessionInclude<ExtArgs> | null
    where?: AnalysisSessionWhereInput
    orderBy?: AnalysisSessionOrderByWithRelationInput | AnalysisSessionOrderByWithRelationInput[]
    cursor?: AnalysisSessionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AnalysisSessionScalarFieldEnum | AnalysisSessionScalarFieldEnum[]
  }

  /**
   * TestFile.executions
   */
  export type TestFile$executionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestExecution
     */
    select?: TestExecutionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestExecutionInclude<ExtArgs> | null
    where?: TestExecutionWhereInput
    orderBy?: TestExecutionOrderByWithRelationInput | TestExecutionOrderByWithRelationInput[]
    cursor?: TestExecutionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TestExecutionScalarFieldEnum | TestExecutionScalarFieldEnum[]
  }

  /**
   * TestFile.coverage
   */
  export type TestFile$coverageArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestCoverage
     */
    select?: TestCoverageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestCoverageInclude<ExtArgs> | null
    where?: TestCoverageWhereInput
    orderBy?: TestCoverageOrderByWithRelationInput | TestCoverageOrderByWithRelationInput[]
    cursor?: TestCoverageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TestCoverageScalarFieldEnum | TestCoverageScalarFieldEnum[]
  }

  /**
   * TestFile.fixes
   */
  export type TestFile$fixesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestFix
     */
    select?: TestFixSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestFixInclude<ExtArgs> | null
    where?: TestFixWhereInput
    orderBy?: TestFixOrderByWithRelationInput | TestFixOrderByWithRelationInput[]
    cursor?: TestFixWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TestFixScalarFieldEnum | TestFixScalarFieldEnum[]
  }

  /**
   * TestFile.generations
   */
  export type TestFile$generationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestGeneration
     */
    select?: TestGenerationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestGenerationInclude<ExtArgs> | null
    where?: TestGenerationWhereInput
    orderBy?: TestGenerationOrderByWithRelationInput | TestGenerationOrderByWithRelationInput[]
    cursor?: TestGenerationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TestGenerationScalarFieldEnum | TestGenerationScalarFieldEnum[]
  }

  /**
   * TestFile.analyses
   */
  export type TestFile$analysesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestAnalysis
     */
    select?: TestAnalysisSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestAnalysisInclude<ExtArgs> | null
    where?: TestAnalysisWhereInput
    orderBy?: TestAnalysisOrderByWithRelationInput | TestAnalysisOrderByWithRelationInput[]
    cursor?: TestAnalysisWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TestAnalysisScalarFieldEnum | TestAnalysisScalarFieldEnum[]
  }

  /**
   * TestFile without action
   */
  export type TestFileDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestFile
     */
    select?: TestFileSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestFileInclude<ExtArgs> | null
  }


  /**
   * Model TestAnalysis
   */

  export type AggregateTestAnalysis = {
    _count: TestAnalysisCountAggregateOutputType | null
    _min: TestAnalysisMinAggregateOutputType | null
    _max: TestAnalysisMaxAggregateOutputType | null
  }

  export type TestAnalysisMinAggregateOutputType = {
    id: string | null
    sessionId: string | null
    testFileId: string | null
    timestamp: Date | null
  }

  export type TestAnalysisMaxAggregateOutputType = {
    id: string | null
    sessionId: string | null
    testFileId: string | null
    timestamp: Date | null
  }

  export type TestAnalysisCountAggregateOutputType = {
    id: number
    sessionId: number
    testFileId: number
    patterns: number
    antiPatterns: number
    suggestions: number
    context: number
    timestamp: number
    _all: number
  }


  export type TestAnalysisMinAggregateInputType = {
    id?: true
    sessionId?: true
    testFileId?: true
    timestamp?: true
  }

  export type TestAnalysisMaxAggregateInputType = {
    id?: true
    sessionId?: true
    testFileId?: true
    timestamp?: true
  }

  export type TestAnalysisCountAggregateInputType = {
    id?: true
    sessionId?: true
    testFileId?: true
    patterns?: true
    antiPatterns?: true
    suggestions?: true
    context?: true
    timestamp?: true
    _all?: true
  }

  export type TestAnalysisAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TestAnalysis to aggregate.
     */
    where?: TestAnalysisWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestAnalyses to fetch.
     */
    orderBy?: TestAnalysisOrderByWithRelationInput | TestAnalysisOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TestAnalysisWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestAnalyses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestAnalyses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TestAnalyses
    **/
    _count?: true | TestAnalysisCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TestAnalysisMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TestAnalysisMaxAggregateInputType
  }

  export type GetTestAnalysisAggregateType<T extends TestAnalysisAggregateArgs> = {
        [P in keyof T & keyof AggregateTestAnalysis]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTestAnalysis[P]>
      : GetScalarType<T[P], AggregateTestAnalysis[P]>
  }




  export type TestAnalysisGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TestAnalysisWhereInput
    orderBy?: TestAnalysisOrderByWithAggregationInput | TestAnalysisOrderByWithAggregationInput[]
    by: TestAnalysisScalarFieldEnum[] | TestAnalysisScalarFieldEnum
    having?: TestAnalysisScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TestAnalysisCountAggregateInputType | true
    _min?: TestAnalysisMinAggregateInputType
    _max?: TestAnalysisMaxAggregateInputType
  }

  export type TestAnalysisGroupByOutputType = {
    id: string
    sessionId: string
    testFileId: string
    patterns: JsonValue
    antiPatterns: JsonValue
    suggestions: JsonValue
    context: JsonValue
    timestamp: Date
    _count: TestAnalysisCountAggregateOutputType | null
    _min: TestAnalysisMinAggregateOutputType | null
    _max: TestAnalysisMaxAggregateOutputType | null
  }

  type GetTestAnalysisGroupByPayload<T extends TestAnalysisGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TestAnalysisGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TestAnalysisGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TestAnalysisGroupByOutputType[P]>
            : GetScalarType<T[P], TestAnalysisGroupByOutputType[P]>
        }
      >
    >


  export type TestAnalysisSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sessionId?: boolean
    testFileId?: boolean
    patterns?: boolean
    antiPatterns?: boolean
    suggestions?: boolean
    context?: boolean
    timestamp?: boolean
    session?: boolean | AnalysisSessionDefaultArgs<ExtArgs>
    testFile?: boolean | TestFileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["testAnalysis"]>

  export type TestAnalysisSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sessionId?: boolean
    testFileId?: boolean
    patterns?: boolean
    antiPatterns?: boolean
    suggestions?: boolean
    context?: boolean
    timestamp?: boolean
    session?: boolean | AnalysisSessionDefaultArgs<ExtArgs>
    testFile?: boolean | TestFileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["testAnalysis"]>

  export type TestAnalysisSelectScalar = {
    id?: boolean
    sessionId?: boolean
    testFileId?: boolean
    patterns?: boolean
    antiPatterns?: boolean
    suggestions?: boolean
    context?: boolean
    timestamp?: boolean
  }

  export type TestAnalysisInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    session?: boolean | AnalysisSessionDefaultArgs<ExtArgs>
    testFile?: boolean | TestFileDefaultArgs<ExtArgs>
  }
  export type TestAnalysisIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    session?: boolean | AnalysisSessionDefaultArgs<ExtArgs>
    testFile?: boolean | TestFileDefaultArgs<ExtArgs>
  }

  export type $TestAnalysisPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TestAnalysis"
    objects: {
      session: Prisma.$AnalysisSessionPayload<ExtArgs>
      testFile: Prisma.$TestFilePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      sessionId: string
      testFileId: string
      patterns: Prisma.JsonValue
      antiPatterns: Prisma.JsonValue
      suggestions: Prisma.JsonValue
      context: Prisma.JsonValue
      timestamp: Date
    }, ExtArgs["result"]["testAnalysis"]>
    composites: {}
  }

  type TestAnalysisGetPayload<S extends boolean | null | undefined | TestAnalysisDefaultArgs> = $Result.GetResult<Prisma.$TestAnalysisPayload, S>

  type TestAnalysisCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TestAnalysisFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TestAnalysisCountAggregateInputType | true
    }

  export interface TestAnalysisDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TestAnalysis'], meta: { name: 'TestAnalysis' } }
    /**
     * Find zero or one TestAnalysis that matches the filter.
     * @param {TestAnalysisFindUniqueArgs} args - Arguments to find a TestAnalysis
     * @example
     * // Get one TestAnalysis
     * const testAnalysis = await prisma.testAnalysis.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TestAnalysisFindUniqueArgs>(args: SelectSubset<T, TestAnalysisFindUniqueArgs<ExtArgs>>): Prisma__TestAnalysisClient<$Result.GetResult<Prisma.$TestAnalysisPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one TestAnalysis that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {TestAnalysisFindUniqueOrThrowArgs} args - Arguments to find a TestAnalysis
     * @example
     * // Get one TestAnalysis
     * const testAnalysis = await prisma.testAnalysis.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TestAnalysisFindUniqueOrThrowArgs>(args: SelectSubset<T, TestAnalysisFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TestAnalysisClient<$Result.GetResult<Prisma.$TestAnalysisPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first TestAnalysis that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestAnalysisFindFirstArgs} args - Arguments to find a TestAnalysis
     * @example
     * // Get one TestAnalysis
     * const testAnalysis = await prisma.testAnalysis.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TestAnalysisFindFirstArgs>(args?: SelectSubset<T, TestAnalysisFindFirstArgs<ExtArgs>>): Prisma__TestAnalysisClient<$Result.GetResult<Prisma.$TestAnalysisPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first TestAnalysis that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestAnalysisFindFirstOrThrowArgs} args - Arguments to find a TestAnalysis
     * @example
     * // Get one TestAnalysis
     * const testAnalysis = await prisma.testAnalysis.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TestAnalysisFindFirstOrThrowArgs>(args?: SelectSubset<T, TestAnalysisFindFirstOrThrowArgs<ExtArgs>>): Prisma__TestAnalysisClient<$Result.GetResult<Prisma.$TestAnalysisPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more TestAnalyses that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestAnalysisFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TestAnalyses
     * const testAnalyses = await prisma.testAnalysis.findMany()
     * 
     * // Get first 10 TestAnalyses
     * const testAnalyses = await prisma.testAnalysis.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const testAnalysisWithIdOnly = await prisma.testAnalysis.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TestAnalysisFindManyArgs>(args?: SelectSubset<T, TestAnalysisFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TestAnalysisPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a TestAnalysis.
     * @param {TestAnalysisCreateArgs} args - Arguments to create a TestAnalysis.
     * @example
     * // Create one TestAnalysis
     * const TestAnalysis = await prisma.testAnalysis.create({
     *   data: {
     *     // ... data to create a TestAnalysis
     *   }
     * })
     * 
     */
    create<T extends TestAnalysisCreateArgs>(args: SelectSubset<T, TestAnalysisCreateArgs<ExtArgs>>): Prisma__TestAnalysisClient<$Result.GetResult<Prisma.$TestAnalysisPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many TestAnalyses.
     * @param {TestAnalysisCreateManyArgs} args - Arguments to create many TestAnalyses.
     * @example
     * // Create many TestAnalyses
     * const testAnalysis = await prisma.testAnalysis.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TestAnalysisCreateManyArgs>(args?: SelectSubset<T, TestAnalysisCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TestAnalyses and returns the data saved in the database.
     * @param {TestAnalysisCreateManyAndReturnArgs} args - Arguments to create many TestAnalyses.
     * @example
     * // Create many TestAnalyses
     * const testAnalysis = await prisma.testAnalysis.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TestAnalyses and only return the `id`
     * const testAnalysisWithIdOnly = await prisma.testAnalysis.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TestAnalysisCreateManyAndReturnArgs>(args?: SelectSubset<T, TestAnalysisCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TestAnalysisPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a TestAnalysis.
     * @param {TestAnalysisDeleteArgs} args - Arguments to delete one TestAnalysis.
     * @example
     * // Delete one TestAnalysis
     * const TestAnalysis = await prisma.testAnalysis.delete({
     *   where: {
     *     // ... filter to delete one TestAnalysis
     *   }
     * })
     * 
     */
    delete<T extends TestAnalysisDeleteArgs>(args: SelectSubset<T, TestAnalysisDeleteArgs<ExtArgs>>): Prisma__TestAnalysisClient<$Result.GetResult<Prisma.$TestAnalysisPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one TestAnalysis.
     * @param {TestAnalysisUpdateArgs} args - Arguments to update one TestAnalysis.
     * @example
     * // Update one TestAnalysis
     * const testAnalysis = await prisma.testAnalysis.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TestAnalysisUpdateArgs>(args: SelectSubset<T, TestAnalysisUpdateArgs<ExtArgs>>): Prisma__TestAnalysisClient<$Result.GetResult<Prisma.$TestAnalysisPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more TestAnalyses.
     * @param {TestAnalysisDeleteManyArgs} args - Arguments to filter TestAnalyses to delete.
     * @example
     * // Delete a few TestAnalyses
     * const { count } = await prisma.testAnalysis.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TestAnalysisDeleteManyArgs>(args?: SelectSubset<T, TestAnalysisDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TestAnalyses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestAnalysisUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TestAnalyses
     * const testAnalysis = await prisma.testAnalysis.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TestAnalysisUpdateManyArgs>(args: SelectSubset<T, TestAnalysisUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one TestAnalysis.
     * @param {TestAnalysisUpsertArgs} args - Arguments to update or create a TestAnalysis.
     * @example
     * // Update or create a TestAnalysis
     * const testAnalysis = await prisma.testAnalysis.upsert({
     *   create: {
     *     // ... data to create a TestAnalysis
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TestAnalysis we want to update
     *   }
     * })
     */
    upsert<T extends TestAnalysisUpsertArgs>(args: SelectSubset<T, TestAnalysisUpsertArgs<ExtArgs>>): Prisma__TestAnalysisClient<$Result.GetResult<Prisma.$TestAnalysisPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of TestAnalyses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestAnalysisCountArgs} args - Arguments to filter TestAnalyses to count.
     * @example
     * // Count the number of TestAnalyses
     * const count = await prisma.testAnalysis.count({
     *   where: {
     *     // ... the filter for the TestAnalyses we want to count
     *   }
     * })
    **/
    count<T extends TestAnalysisCountArgs>(
      args?: Subset<T, TestAnalysisCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TestAnalysisCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TestAnalysis.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestAnalysisAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TestAnalysisAggregateArgs>(args: Subset<T, TestAnalysisAggregateArgs>): Prisma.PrismaPromise<GetTestAnalysisAggregateType<T>>

    /**
     * Group by TestAnalysis.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestAnalysisGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TestAnalysisGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TestAnalysisGroupByArgs['orderBy'] }
        : { orderBy?: TestAnalysisGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TestAnalysisGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTestAnalysisGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TestAnalysis model
   */
  readonly fields: TestAnalysisFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TestAnalysis.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TestAnalysisClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    session<T extends AnalysisSessionDefaultArgs<ExtArgs> = {}>(args?: Subset<T, AnalysisSessionDefaultArgs<ExtArgs>>): Prisma__AnalysisSessionClient<$Result.GetResult<Prisma.$AnalysisSessionPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    testFile<T extends TestFileDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TestFileDefaultArgs<ExtArgs>>): Prisma__TestFileClient<$Result.GetResult<Prisma.$TestFilePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TestAnalysis model
   */ 
  interface TestAnalysisFieldRefs {
    readonly id: FieldRef<"TestAnalysis", 'String'>
    readonly sessionId: FieldRef<"TestAnalysis", 'String'>
    readonly testFileId: FieldRef<"TestAnalysis", 'String'>
    readonly patterns: FieldRef<"TestAnalysis", 'Json'>
    readonly antiPatterns: FieldRef<"TestAnalysis", 'Json'>
    readonly suggestions: FieldRef<"TestAnalysis", 'Json'>
    readonly context: FieldRef<"TestAnalysis", 'Json'>
    readonly timestamp: FieldRef<"TestAnalysis", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TestAnalysis findUnique
   */
  export type TestAnalysisFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestAnalysis
     */
    select?: TestAnalysisSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestAnalysisInclude<ExtArgs> | null
    /**
     * Filter, which TestAnalysis to fetch.
     */
    where: TestAnalysisWhereUniqueInput
  }

  /**
   * TestAnalysis findUniqueOrThrow
   */
  export type TestAnalysisFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestAnalysis
     */
    select?: TestAnalysisSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestAnalysisInclude<ExtArgs> | null
    /**
     * Filter, which TestAnalysis to fetch.
     */
    where: TestAnalysisWhereUniqueInput
  }

  /**
   * TestAnalysis findFirst
   */
  export type TestAnalysisFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestAnalysis
     */
    select?: TestAnalysisSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestAnalysisInclude<ExtArgs> | null
    /**
     * Filter, which TestAnalysis to fetch.
     */
    where?: TestAnalysisWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestAnalyses to fetch.
     */
    orderBy?: TestAnalysisOrderByWithRelationInput | TestAnalysisOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TestAnalyses.
     */
    cursor?: TestAnalysisWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestAnalyses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestAnalyses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TestAnalyses.
     */
    distinct?: TestAnalysisScalarFieldEnum | TestAnalysisScalarFieldEnum[]
  }

  /**
   * TestAnalysis findFirstOrThrow
   */
  export type TestAnalysisFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestAnalysis
     */
    select?: TestAnalysisSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestAnalysisInclude<ExtArgs> | null
    /**
     * Filter, which TestAnalysis to fetch.
     */
    where?: TestAnalysisWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestAnalyses to fetch.
     */
    orderBy?: TestAnalysisOrderByWithRelationInput | TestAnalysisOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TestAnalyses.
     */
    cursor?: TestAnalysisWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestAnalyses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestAnalyses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TestAnalyses.
     */
    distinct?: TestAnalysisScalarFieldEnum | TestAnalysisScalarFieldEnum[]
  }

  /**
   * TestAnalysis findMany
   */
  export type TestAnalysisFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestAnalysis
     */
    select?: TestAnalysisSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestAnalysisInclude<ExtArgs> | null
    /**
     * Filter, which TestAnalyses to fetch.
     */
    where?: TestAnalysisWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestAnalyses to fetch.
     */
    orderBy?: TestAnalysisOrderByWithRelationInput | TestAnalysisOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TestAnalyses.
     */
    cursor?: TestAnalysisWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestAnalyses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestAnalyses.
     */
    skip?: number
    distinct?: TestAnalysisScalarFieldEnum | TestAnalysisScalarFieldEnum[]
  }

  /**
   * TestAnalysis create
   */
  export type TestAnalysisCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestAnalysis
     */
    select?: TestAnalysisSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestAnalysisInclude<ExtArgs> | null
    /**
     * The data needed to create a TestAnalysis.
     */
    data: XOR<TestAnalysisCreateInput, TestAnalysisUncheckedCreateInput>
  }

  /**
   * TestAnalysis createMany
   */
  export type TestAnalysisCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TestAnalyses.
     */
    data: TestAnalysisCreateManyInput | TestAnalysisCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TestAnalysis createManyAndReturn
   */
  export type TestAnalysisCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestAnalysis
     */
    select?: TestAnalysisSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many TestAnalyses.
     */
    data: TestAnalysisCreateManyInput | TestAnalysisCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestAnalysisIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TestAnalysis update
   */
  export type TestAnalysisUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestAnalysis
     */
    select?: TestAnalysisSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestAnalysisInclude<ExtArgs> | null
    /**
     * The data needed to update a TestAnalysis.
     */
    data: XOR<TestAnalysisUpdateInput, TestAnalysisUncheckedUpdateInput>
    /**
     * Choose, which TestAnalysis to update.
     */
    where: TestAnalysisWhereUniqueInput
  }

  /**
   * TestAnalysis updateMany
   */
  export type TestAnalysisUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TestAnalyses.
     */
    data: XOR<TestAnalysisUpdateManyMutationInput, TestAnalysisUncheckedUpdateManyInput>
    /**
     * Filter which TestAnalyses to update
     */
    where?: TestAnalysisWhereInput
  }

  /**
   * TestAnalysis upsert
   */
  export type TestAnalysisUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestAnalysis
     */
    select?: TestAnalysisSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestAnalysisInclude<ExtArgs> | null
    /**
     * The filter to search for the TestAnalysis to update in case it exists.
     */
    where: TestAnalysisWhereUniqueInput
    /**
     * In case the TestAnalysis found by the `where` argument doesn't exist, create a new TestAnalysis with this data.
     */
    create: XOR<TestAnalysisCreateInput, TestAnalysisUncheckedCreateInput>
    /**
     * In case the TestAnalysis was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TestAnalysisUpdateInput, TestAnalysisUncheckedUpdateInput>
  }

  /**
   * TestAnalysis delete
   */
  export type TestAnalysisDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestAnalysis
     */
    select?: TestAnalysisSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestAnalysisInclude<ExtArgs> | null
    /**
     * Filter which TestAnalysis to delete.
     */
    where: TestAnalysisWhereUniqueInput
  }

  /**
   * TestAnalysis deleteMany
   */
  export type TestAnalysisDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TestAnalyses to delete
     */
    where?: TestAnalysisWhereInput
  }

  /**
   * TestAnalysis without action
   */
  export type TestAnalysisDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestAnalysis
     */
    select?: TestAnalysisSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestAnalysisInclude<ExtArgs> | null
  }


  /**
   * Model TestPattern
   */

  export type AggregateTestPattern = {
    _count: TestPatternCountAggregateOutputType | null
    _avg: TestPatternAvgAggregateOutputType | null
    _sum: TestPatternSumAggregateOutputType | null
    _min: TestPatternMinAggregateOutputType | null
    _max: TestPatternMaxAggregateOutputType | null
  }

  export type TestPatternAvgAggregateOutputType = {
    successRate: number | null
    usageCount: number | null
  }

  export type TestPatternSumAggregateOutputType = {
    successRate: number | null
    usageCount: number | null
  }

  export type TestPatternMinAggregateOutputType = {
    id: string | null
    type: $Enums.PatternType | null
    pattern: string | null
    successRate: number | null
    usageCount: number | null
    lastUsed: Date | null
    createdAt: Date | null
  }

  export type TestPatternMaxAggregateOutputType = {
    id: string | null
    type: $Enums.PatternType | null
    pattern: string | null
    successRate: number | null
    usageCount: number | null
    lastUsed: Date | null
    createdAt: Date | null
  }

  export type TestPatternCountAggregateOutputType = {
    id: number
    type: number
    pattern: number
    context: number
    successRate: number
    usageCount: number
    lastUsed: number
    createdAt: number
    _all: number
  }


  export type TestPatternAvgAggregateInputType = {
    successRate?: true
    usageCount?: true
  }

  export type TestPatternSumAggregateInputType = {
    successRate?: true
    usageCount?: true
  }

  export type TestPatternMinAggregateInputType = {
    id?: true
    type?: true
    pattern?: true
    successRate?: true
    usageCount?: true
    lastUsed?: true
    createdAt?: true
  }

  export type TestPatternMaxAggregateInputType = {
    id?: true
    type?: true
    pattern?: true
    successRate?: true
    usageCount?: true
    lastUsed?: true
    createdAt?: true
  }

  export type TestPatternCountAggregateInputType = {
    id?: true
    type?: true
    pattern?: true
    context?: true
    successRate?: true
    usageCount?: true
    lastUsed?: true
    createdAt?: true
    _all?: true
  }

  export type TestPatternAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TestPattern to aggregate.
     */
    where?: TestPatternWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestPatterns to fetch.
     */
    orderBy?: TestPatternOrderByWithRelationInput | TestPatternOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TestPatternWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestPatterns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestPatterns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TestPatterns
    **/
    _count?: true | TestPatternCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TestPatternAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TestPatternSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TestPatternMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TestPatternMaxAggregateInputType
  }

  export type GetTestPatternAggregateType<T extends TestPatternAggregateArgs> = {
        [P in keyof T & keyof AggregateTestPattern]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTestPattern[P]>
      : GetScalarType<T[P], AggregateTestPattern[P]>
  }




  export type TestPatternGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TestPatternWhereInput
    orderBy?: TestPatternOrderByWithAggregationInput | TestPatternOrderByWithAggregationInput[]
    by: TestPatternScalarFieldEnum[] | TestPatternScalarFieldEnum
    having?: TestPatternScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TestPatternCountAggregateInputType | true
    _avg?: TestPatternAvgAggregateInputType
    _sum?: TestPatternSumAggregateInputType
    _min?: TestPatternMinAggregateInputType
    _max?: TestPatternMaxAggregateInputType
  }

  export type TestPatternGroupByOutputType = {
    id: string
    type: $Enums.PatternType
    pattern: string
    context: JsonValue
    successRate: number
    usageCount: number
    lastUsed: Date
    createdAt: Date
    _count: TestPatternCountAggregateOutputType | null
    _avg: TestPatternAvgAggregateOutputType | null
    _sum: TestPatternSumAggregateOutputType | null
    _min: TestPatternMinAggregateOutputType | null
    _max: TestPatternMaxAggregateOutputType | null
  }

  type GetTestPatternGroupByPayload<T extends TestPatternGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TestPatternGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TestPatternGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TestPatternGroupByOutputType[P]>
            : GetScalarType<T[P], TestPatternGroupByOutputType[P]>
        }
      >
    >


  export type TestPatternSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    pattern?: boolean
    context?: boolean
    successRate?: boolean
    usageCount?: boolean
    lastUsed?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["testPattern"]>

  export type TestPatternSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    pattern?: boolean
    context?: boolean
    successRate?: boolean
    usageCount?: boolean
    lastUsed?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["testPattern"]>

  export type TestPatternSelectScalar = {
    id?: boolean
    type?: boolean
    pattern?: boolean
    context?: boolean
    successRate?: boolean
    usageCount?: boolean
    lastUsed?: boolean
    createdAt?: boolean
  }


  export type $TestPatternPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TestPattern"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      type: $Enums.PatternType
      pattern: string
      context: Prisma.JsonValue
      successRate: number
      usageCount: number
      lastUsed: Date
      createdAt: Date
    }, ExtArgs["result"]["testPattern"]>
    composites: {}
  }

  type TestPatternGetPayload<S extends boolean | null | undefined | TestPatternDefaultArgs> = $Result.GetResult<Prisma.$TestPatternPayload, S>

  type TestPatternCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TestPatternFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TestPatternCountAggregateInputType | true
    }

  export interface TestPatternDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TestPattern'], meta: { name: 'TestPattern' } }
    /**
     * Find zero or one TestPattern that matches the filter.
     * @param {TestPatternFindUniqueArgs} args - Arguments to find a TestPattern
     * @example
     * // Get one TestPattern
     * const testPattern = await prisma.testPattern.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TestPatternFindUniqueArgs>(args: SelectSubset<T, TestPatternFindUniqueArgs<ExtArgs>>): Prisma__TestPatternClient<$Result.GetResult<Prisma.$TestPatternPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one TestPattern that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {TestPatternFindUniqueOrThrowArgs} args - Arguments to find a TestPattern
     * @example
     * // Get one TestPattern
     * const testPattern = await prisma.testPattern.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TestPatternFindUniqueOrThrowArgs>(args: SelectSubset<T, TestPatternFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TestPatternClient<$Result.GetResult<Prisma.$TestPatternPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first TestPattern that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestPatternFindFirstArgs} args - Arguments to find a TestPattern
     * @example
     * // Get one TestPattern
     * const testPattern = await prisma.testPattern.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TestPatternFindFirstArgs>(args?: SelectSubset<T, TestPatternFindFirstArgs<ExtArgs>>): Prisma__TestPatternClient<$Result.GetResult<Prisma.$TestPatternPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first TestPattern that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestPatternFindFirstOrThrowArgs} args - Arguments to find a TestPattern
     * @example
     * // Get one TestPattern
     * const testPattern = await prisma.testPattern.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TestPatternFindFirstOrThrowArgs>(args?: SelectSubset<T, TestPatternFindFirstOrThrowArgs<ExtArgs>>): Prisma__TestPatternClient<$Result.GetResult<Prisma.$TestPatternPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more TestPatterns that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestPatternFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TestPatterns
     * const testPatterns = await prisma.testPattern.findMany()
     * 
     * // Get first 10 TestPatterns
     * const testPatterns = await prisma.testPattern.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const testPatternWithIdOnly = await prisma.testPattern.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TestPatternFindManyArgs>(args?: SelectSubset<T, TestPatternFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TestPatternPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a TestPattern.
     * @param {TestPatternCreateArgs} args - Arguments to create a TestPattern.
     * @example
     * // Create one TestPattern
     * const TestPattern = await prisma.testPattern.create({
     *   data: {
     *     // ... data to create a TestPattern
     *   }
     * })
     * 
     */
    create<T extends TestPatternCreateArgs>(args: SelectSubset<T, TestPatternCreateArgs<ExtArgs>>): Prisma__TestPatternClient<$Result.GetResult<Prisma.$TestPatternPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many TestPatterns.
     * @param {TestPatternCreateManyArgs} args - Arguments to create many TestPatterns.
     * @example
     * // Create many TestPatterns
     * const testPattern = await prisma.testPattern.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TestPatternCreateManyArgs>(args?: SelectSubset<T, TestPatternCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TestPatterns and returns the data saved in the database.
     * @param {TestPatternCreateManyAndReturnArgs} args - Arguments to create many TestPatterns.
     * @example
     * // Create many TestPatterns
     * const testPattern = await prisma.testPattern.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TestPatterns and only return the `id`
     * const testPatternWithIdOnly = await prisma.testPattern.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TestPatternCreateManyAndReturnArgs>(args?: SelectSubset<T, TestPatternCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TestPatternPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a TestPattern.
     * @param {TestPatternDeleteArgs} args - Arguments to delete one TestPattern.
     * @example
     * // Delete one TestPattern
     * const TestPattern = await prisma.testPattern.delete({
     *   where: {
     *     // ... filter to delete one TestPattern
     *   }
     * })
     * 
     */
    delete<T extends TestPatternDeleteArgs>(args: SelectSubset<T, TestPatternDeleteArgs<ExtArgs>>): Prisma__TestPatternClient<$Result.GetResult<Prisma.$TestPatternPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one TestPattern.
     * @param {TestPatternUpdateArgs} args - Arguments to update one TestPattern.
     * @example
     * // Update one TestPattern
     * const testPattern = await prisma.testPattern.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TestPatternUpdateArgs>(args: SelectSubset<T, TestPatternUpdateArgs<ExtArgs>>): Prisma__TestPatternClient<$Result.GetResult<Prisma.$TestPatternPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more TestPatterns.
     * @param {TestPatternDeleteManyArgs} args - Arguments to filter TestPatterns to delete.
     * @example
     * // Delete a few TestPatterns
     * const { count } = await prisma.testPattern.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TestPatternDeleteManyArgs>(args?: SelectSubset<T, TestPatternDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TestPatterns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestPatternUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TestPatterns
     * const testPattern = await prisma.testPattern.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TestPatternUpdateManyArgs>(args: SelectSubset<T, TestPatternUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one TestPattern.
     * @param {TestPatternUpsertArgs} args - Arguments to update or create a TestPattern.
     * @example
     * // Update or create a TestPattern
     * const testPattern = await prisma.testPattern.upsert({
     *   create: {
     *     // ... data to create a TestPattern
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TestPattern we want to update
     *   }
     * })
     */
    upsert<T extends TestPatternUpsertArgs>(args: SelectSubset<T, TestPatternUpsertArgs<ExtArgs>>): Prisma__TestPatternClient<$Result.GetResult<Prisma.$TestPatternPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of TestPatterns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestPatternCountArgs} args - Arguments to filter TestPatterns to count.
     * @example
     * // Count the number of TestPatterns
     * const count = await prisma.testPattern.count({
     *   where: {
     *     // ... the filter for the TestPatterns we want to count
     *   }
     * })
    **/
    count<T extends TestPatternCountArgs>(
      args?: Subset<T, TestPatternCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TestPatternCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TestPattern.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestPatternAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TestPatternAggregateArgs>(args: Subset<T, TestPatternAggregateArgs>): Prisma.PrismaPromise<GetTestPatternAggregateType<T>>

    /**
     * Group by TestPattern.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestPatternGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TestPatternGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TestPatternGroupByArgs['orderBy'] }
        : { orderBy?: TestPatternGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TestPatternGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTestPatternGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TestPattern model
   */
  readonly fields: TestPatternFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TestPattern.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TestPatternClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TestPattern model
   */ 
  interface TestPatternFieldRefs {
    readonly id: FieldRef<"TestPattern", 'String'>
    readonly type: FieldRef<"TestPattern", 'PatternType'>
    readonly pattern: FieldRef<"TestPattern", 'String'>
    readonly context: FieldRef<"TestPattern", 'Json'>
    readonly successRate: FieldRef<"TestPattern", 'Float'>
    readonly usageCount: FieldRef<"TestPattern", 'Int'>
    readonly lastUsed: FieldRef<"TestPattern", 'DateTime'>
    readonly createdAt: FieldRef<"TestPattern", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TestPattern findUnique
   */
  export type TestPatternFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestPattern
     */
    select?: TestPatternSelect<ExtArgs> | null
    /**
     * Filter, which TestPattern to fetch.
     */
    where: TestPatternWhereUniqueInput
  }

  /**
   * TestPattern findUniqueOrThrow
   */
  export type TestPatternFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestPattern
     */
    select?: TestPatternSelect<ExtArgs> | null
    /**
     * Filter, which TestPattern to fetch.
     */
    where: TestPatternWhereUniqueInput
  }

  /**
   * TestPattern findFirst
   */
  export type TestPatternFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestPattern
     */
    select?: TestPatternSelect<ExtArgs> | null
    /**
     * Filter, which TestPattern to fetch.
     */
    where?: TestPatternWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestPatterns to fetch.
     */
    orderBy?: TestPatternOrderByWithRelationInput | TestPatternOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TestPatterns.
     */
    cursor?: TestPatternWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestPatterns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestPatterns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TestPatterns.
     */
    distinct?: TestPatternScalarFieldEnum | TestPatternScalarFieldEnum[]
  }

  /**
   * TestPattern findFirstOrThrow
   */
  export type TestPatternFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestPattern
     */
    select?: TestPatternSelect<ExtArgs> | null
    /**
     * Filter, which TestPattern to fetch.
     */
    where?: TestPatternWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestPatterns to fetch.
     */
    orderBy?: TestPatternOrderByWithRelationInput | TestPatternOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TestPatterns.
     */
    cursor?: TestPatternWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestPatterns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestPatterns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TestPatterns.
     */
    distinct?: TestPatternScalarFieldEnum | TestPatternScalarFieldEnum[]
  }

  /**
   * TestPattern findMany
   */
  export type TestPatternFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestPattern
     */
    select?: TestPatternSelect<ExtArgs> | null
    /**
     * Filter, which TestPatterns to fetch.
     */
    where?: TestPatternWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestPatterns to fetch.
     */
    orderBy?: TestPatternOrderByWithRelationInput | TestPatternOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TestPatterns.
     */
    cursor?: TestPatternWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestPatterns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestPatterns.
     */
    skip?: number
    distinct?: TestPatternScalarFieldEnum | TestPatternScalarFieldEnum[]
  }

  /**
   * TestPattern create
   */
  export type TestPatternCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestPattern
     */
    select?: TestPatternSelect<ExtArgs> | null
    /**
     * The data needed to create a TestPattern.
     */
    data: XOR<TestPatternCreateInput, TestPatternUncheckedCreateInput>
  }

  /**
   * TestPattern createMany
   */
  export type TestPatternCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TestPatterns.
     */
    data: TestPatternCreateManyInput | TestPatternCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TestPattern createManyAndReturn
   */
  export type TestPatternCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestPattern
     */
    select?: TestPatternSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many TestPatterns.
     */
    data: TestPatternCreateManyInput | TestPatternCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TestPattern update
   */
  export type TestPatternUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestPattern
     */
    select?: TestPatternSelect<ExtArgs> | null
    /**
     * The data needed to update a TestPattern.
     */
    data: XOR<TestPatternUpdateInput, TestPatternUncheckedUpdateInput>
    /**
     * Choose, which TestPattern to update.
     */
    where: TestPatternWhereUniqueInput
  }

  /**
   * TestPattern updateMany
   */
  export type TestPatternUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TestPatterns.
     */
    data: XOR<TestPatternUpdateManyMutationInput, TestPatternUncheckedUpdateManyInput>
    /**
     * Filter which TestPatterns to update
     */
    where?: TestPatternWhereInput
  }

  /**
   * TestPattern upsert
   */
  export type TestPatternUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestPattern
     */
    select?: TestPatternSelect<ExtArgs> | null
    /**
     * The filter to search for the TestPattern to update in case it exists.
     */
    where: TestPatternWhereUniqueInput
    /**
     * In case the TestPattern found by the `where` argument doesn't exist, create a new TestPattern with this data.
     */
    create: XOR<TestPatternCreateInput, TestPatternUncheckedCreateInput>
    /**
     * In case the TestPattern was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TestPatternUpdateInput, TestPatternUncheckedUpdateInput>
  }

  /**
   * TestPattern delete
   */
  export type TestPatternDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestPattern
     */
    select?: TestPatternSelect<ExtArgs> | null
    /**
     * Filter which TestPattern to delete.
     */
    where: TestPatternWhereUniqueInput
  }

  /**
   * TestPattern deleteMany
   */
  export type TestPatternDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TestPatterns to delete
     */
    where?: TestPatternWhereInput
  }

  /**
   * TestPattern without action
   */
  export type TestPatternDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestPattern
     */
    select?: TestPatternSelect<ExtArgs> | null
  }


  /**
   * Model FixPattern
   */

  export type AggregateFixPattern = {
    _count: FixPatternCountAggregateOutputType | null
    _avg: FixPatternAvgAggregateOutputType | null
    _sum: FixPatternSumAggregateOutputType | null
    _min: FixPatternMinAggregateOutputType | null
    _max: FixPatternMaxAggregateOutputType | null
  }

  export type FixPatternAvgAggregateOutputType = {
    successRate: number | null
    usageCount: number | null
  }

  export type FixPatternSumAggregateOutputType = {
    successRate: number | null
    usageCount: number | null
  }

  export type FixPatternMinAggregateOutputType = {
    id: string | null
    problem: string | null
    solution: string | null
    successRate: number | null
    usageCount: number | null
    lastUsed: Date | null
    createdAt: Date | null
  }

  export type FixPatternMaxAggregateOutputType = {
    id: string | null
    problem: string | null
    solution: string | null
    successRate: number | null
    usageCount: number | null
    lastUsed: Date | null
    createdAt: Date | null
  }

  export type FixPatternCountAggregateOutputType = {
    id: number
    problem: number
    solution: number
    context: number
    successRate: number
    usageCount: number
    lastUsed: number
    createdAt: number
    _all: number
  }


  export type FixPatternAvgAggregateInputType = {
    successRate?: true
    usageCount?: true
  }

  export type FixPatternSumAggregateInputType = {
    successRate?: true
    usageCount?: true
  }

  export type FixPatternMinAggregateInputType = {
    id?: true
    problem?: true
    solution?: true
    successRate?: true
    usageCount?: true
    lastUsed?: true
    createdAt?: true
  }

  export type FixPatternMaxAggregateInputType = {
    id?: true
    problem?: true
    solution?: true
    successRate?: true
    usageCount?: true
    lastUsed?: true
    createdAt?: true
  }

  export type FixPatternCountAggregateInputType = {
    id?: true
    problem?: true
    solution?: true
    context?: true
    successRate?: true
    usageCount?: true
    lastUsed?: true
    createdAt?: true
    _all?: true
  }

  export type FixPatternAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which FixPattern to aggregate.
     */
    where?: FixPatternWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FixPatterns to fetch.
     */
    orderBy?: FixPatternOrderByWithRelationInput | FixPatternOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: FixPatternWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FixPatterns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FixPatterns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned FixPatterns
    **/
    _count?: true | FixPatternCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: FixPatternAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: FixPatternSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: FixPatternMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: FixPatternMaxAggregateInputType
  }

  export type GetFixPatternAggregateType<T extends FixPatternAggregateArgs> = {
        [P in keyof T & keyof AggregateFixPattern]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFixPattern[P]>
      : GetScalarType<T[P], AggregateFixPattern[P]>
  }




  export type FixPatternGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FixPatternWhereInput
    orderBy?: FixPatternOrderByWithAggregationInput | FixPatternOrderByWithAggregationInput[]
    by: FixPatternScalarFieldEnum[] | FixPatternScalarFieldEnum
    having?: FixPatternScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: FixPatternCountAggregateInputType | true
    _avg?: FixPatternAvgAggregateInputType
    _sum?: FixPatternSumAggregateInputType
    _min?: FixPatternMinAggregateInputType
    _max?: FixPatternMaxAggregateInputType
  }

  export type FixPatternGroupByOutputType = {
    id: string
    problem: string
    solution: string
    context: JsonValue
    successRate: number
    usageCount: number
    lastUsed: Date
    createdAt: Date
    _count: FixPatternCountAggregateOutputType | null
    _avg: FixPatternAvgAggregateOutputType | null
    _sum: FixPatternSumAggregateOutputType | null
    _min: FixPatternMinAggregateOutputType | null
    _max: FixPatternMaxAggregateOutputType | null
  }

  type GetFixPatternGroupByPayload<T extends FixPatternGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<FixPatternGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof FixPatternGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], FixPatternGroupByOutputType[P]>
            : GetScalarType<T[P], FixPatternGroupByOutputType[P]>
        }
      >
    >


  export type FixPatternSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    problem?: boolean
    solution?: boolean
    context?: boolean
    successRate?: boolean
    usageCount?: boolean
    lastUsed?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["fixPattern"]>

  export type FixPatternSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    problem?: boolean
    solution?: boolean
    context?: boolean
    successRate?: boolean
    usageCount?: boolean
    lastUsed?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["fixPattern"]>

  export type FixPatternSelectScalar = {
    id?: boolean
    problem?: boolean
    solution?: boolean
    context?: boolean
    successRate?: boolean
    usageCount?: boolean
    lastUsed?: boolean
    createdAt?: boolean
  }


  export type $FixPatternPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "FixPattern"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      problem: string
      solution: string
      context: Prisma.JsonValue
      successRate: number
      usageCount: number
      lastUsed: Date
      createdAt: Date
    }, ExtArgs["result"]["fixPattern"]>
    composites: {}
  }

  type FixPatternGetPayload<S extends boolean | null | undefined | FixPatternDefaultArgs> = $Result.GetResult<Prisma.$FixPatternPayload, S>

  type FixPatternCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<FixPatternFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: FixPatternCountAggregateInputType | true
    }

  export interface FixPatternDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['FixPattern'], meta: { name: 'FixPattern' } }
    /**
     * Find zero or one FixPattern that matches the filter.
     * @param {FixPatternFindUniqueArgs} args - Arguments to find a FixPattern
     * @example
     * // Get one FixPattern
     * const fixPattern = await prisma.fixPattern.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends FixPatternFindUniqueArgs>(args: SelectSubset<T, FixPatternFindUniqueArgs<ExtArgs>>): Prisma__FixPatternClient<$Result.GetResult<Prisma.$FixPatternPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one FixPattern that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {FixPatternFindUniqueOrThrowArgs} args - Arguments to find a FixPattern
     * @example
     * // Get one FixPattern
     * const fixPattern = await prisma.fixPattern.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends FixPatternFindUniqueOrThrowArgs>(args: SelectSubset<T, FixPatternFindUniqueOrThrowArgs<ExtArgs>>): Prisma__FixPatternClient<$Result.GetResult<Prisma.$FixPatternPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first FixPattern that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FixPatternFindFirstArgs} args - Arguments to find a FixPattern
     * @example
     * // Get one FixPattern
     * const fixPattern = await prisma.fixPattern.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends FixPatternFindFirstArgs>(args?: SelectSubset<T, FixPatternFindFirstArgs<ExtArgs>>): Prisma__FixPatternClient<$Result.GetResult<Prisma.$FixPatternPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first FixPattern that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FixPatternFindFirstOrThrowArgs} args - Arguments to find a FixPattern
     * @example
     * // Get one FixPattern
     * const fixPattern = await prisma.fixPattern.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends FixPatternFindFirstOrThrowArgs>(args?: SelectSubset<T, FixPatternFindFirstOrThrowArgs<ExtArgs>>): Prisma__FixPatternClient<$Result.GetResult<Prisma.$FixPatternPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more FixPatterns that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FixPatternFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all FixPatterns
     * const fixPatterns = await prisma.fixPattern.findMany()
     * 
     * // Get first 10 FixPatterns
     * const fixPatterns = await prisma.fixPattern.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const fixPatternWithIdOnly = await prisma.fixPattern.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends FixPatternFindManyArgs>(args?: SelectSubset<T, FixPatternFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FixPatternPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a FixPattern.
     * @param {FixPatternCreateArgs} args - Arguments to create a FixPattern.
     * @example
     * // Create one FixPattern
     * const FixPattern = await prisma.fixPattern.create({
     *   data: {
     *     // ... data to create a FixPattern
     *   }
     * })
     * 
     */
    create<T extends FixPatternCreateArgs>(args: SelectSubset<T, FixPatternCreateArgs<ExtArgs>>): Prisma__FixPatternClient<$Result.GetResult<Prisma.$FixPatternPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many FixPatterns.
     * @param {FixPatternCreateManyArgs} args - Arguments to create many FixPatterns.
     * @example
     * // Create many FixPatterns
     * const fixPattern = await prisma.fixPattern.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends FixPatternCreateManyArgs>(args?: SelectSubset<T, FixPatternCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many FixPatterns and returns the data saved in the database.
     * @param {FixPatternCreateManyAndReturnArgs} args - Arguments to create many FixPatterns.
     * @example
     * // Create many FixPatterns
     * const fixPattern = await prisma.fixPattern.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many FixPatterns and only return the `id`
     * const fixPatternWithIdOnly = await prisma.fixPattern.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends FixPatternCreateManyAndReturnArgs>(args?: SelectSubset<T, FixPatternCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FixPatternPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a FixPattern.
     * @param {FixPatternDeleteArgs} args - Arguments to delete one FixPattern.
     * @example
     * // Delete one FixPattern
     * const FixPattern = await prisma.fixPattern.delete({
     *   where: {
     *     // ... filter to delete one FixPattern
     *   }
     * })
     * 
     */
    delete<T extends FixPatternDeleteArgs>(args: SelectSubset<T, FixPatternDeleteArgs<ExtArgs>>): Prisma__FixPatternClient<$Result.GetResult<Prisma.$FixPatternPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one FixPattern.
     * @param {FixPatternUpdateArgs} args - Arguments to update one FixPattern.
     * @example
     * // Update one FixPattern
     * const fixPattern = await prisma.fixPattern.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends FixPatternUpdateArgs>(args: SelectSubset<T, FixPatternUpdateArgs<ExtArgs>>): Prisma__FixPatternClient<$Result.GetResult<Prisma.$FixPatternPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more FixPatterns.
     * @param {FixPatternDeleteManyArgs} args - Arguments to filter FixPatterns to delete.
     * @example
     * // Delete a few FixPatterns
     * const { count } = await prisma.fixPattern.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends FixPatternDeleteManyArgs>(args?: SelectSubset<T, FixPatternDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more FixPatterns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FixPatternUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many FixPatterns
     * const fixPattern = await prisma.fixPattern.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends FixPatternUpdateManyArgs>(args: SelectSubset<T, FixPatternUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one FixPattern.
     * @param {FixPatternUpsertArgs} args - Arguments to update or create a FixPattern.
     * @example
     * // Update or create a FixPattern
     * const fixPattern = await prisma.fixPattern.upsert({
     *   create: {
     *     // ... data to create a FixPattern
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the FixPattern we want to update
     *   }
     * })
     */
    upsert<T extends FixPatternUpsertArgs>(args: SelectSubset<T, FixPatternUpsertArgs<ExtArgs>>): Prisma__FixPatternClient<$Result.GetResult<Prisma.$FixPatternPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of FixPatterns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FixPatternCountArgs} args - Arguments to filter FixPatterns to count.
     * @example
     * // Count the number of FixPatterns
     * const count = await prisma.fixPattern.count({
     *   where: {
     *     // ... the filter for the FixPatterns we want to count
     *   }
     * })
    **/
    count<T extends FixPatternCountArgs>(
      args?: Subset<T, FixPatternCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], FixPatternCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a FixPattern.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FixPatternAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends FixPatternAggregateArgs>(args: Subset<T, FixPatternAggregateArgs>): Prisma.PrismaPromise<GetFixPatternAggregateType<T>>

    /**
     * Group by FixPattern.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FixPatternGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends FixPatternGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: FixPatternGroupByArgs['orderBy'] }
        : { orderBy?: FixPatternGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, FixPatternGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFixPatternGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the FixPattern model
   */
  readonly fields: FixPatternFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for FixPattern.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__FixPatternClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the FixPattern model
   */ 
  interface FixPatternFieldRefs {
    readonly id: FieldRef<"FixPattern", 'String'>
    readonly problem: FieldRef<"FixPattern", 'String'>
    readonly solution: FieldRef<"FixPattern", 'String'>
    readonly context: FieldRef<"FixPattern", 'Json'>
    readonly successRate: FieldRef<"FixPattern", 'Float'>
    readonly usageCount: FieldRef<"FixPattern", 'Int'>
    readonly lastUsed: FieldRef<"FixPattern", 'DateTime'>
    readonly createdAt: FieldRef<"FixPattern", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * FixPattern findUnique
   */
  export type FixPatternFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FixPattern
     */
    select?: FixPatternSelect<ExtArgs> | null
    /**
     * Filter, which FixPattern to fetch.
     */
    where: FixPatternWhereUniqueInput
  }

  /**
   * FixPattern findUniqueOrThrow
   */
  export type FixPatternFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FixPattern
     */
    select?: FixPatternSelect<ExtArgs> | null
    /**
     * Filter, which FixPattern to fetch.
     */
    where: FixPatternWhereUniqueInput
  }

  /**
   * FixPattern findFirst
   */
  export type FixPatternFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FixPattern
     */
    select?: FixPatternSelect<ExtArgs> | null
    /**
     * Filter, which FixPattern to fetch.
     */
    where?: FixPatternWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FixPatterns to fetch.
     */
    orderBy?: FixPatternOrderByWithRelationInput | FixPatternOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for FixPatterns.
     */
    cursor?: FixPatternWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FixPatterns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FixPatterns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of FixPatterns.
     */
    distinct?: FixPatternScalarFieldEnum | FixPatternScalarFieldEnum[]
  }

  /**
   * FixPattern findFirstOrThrow
   */
  export type FixPatternFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FixPattern
     */
    select?: FixPatternSelect<ExtArgs> | null
    /**
     * Filter, which FixPattern to fetch.
     */
    where?: FixPatternWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FixPatterns to fetch.
     */
    orderBy?: FixPatternOrderByWithRelationInput | FixPatternOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for FixPatterns.
     */
    cursor?: FixPatternWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FixPatterns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FixPatterns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of FixPatterns.
     */
    distinct?: FixPatternScalarFieldEnum | FixPatternScalarFieldEnum[]
  }

  /**
   * FixPattern findMany
   */
  export type FixPatternFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FixPattern
     */
    select?: FixPatternSelect<ExtArgs> | null
    /**
     * Filter, which FixPatterns to fetch.
     */
    where?: FixPatternWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FixPatterns to fetch.
     */
    orderBy?: FixPatternOrderByWithRelationInput | FixPatternOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing FixPatterns.
     */
    cursor?: FixPatternWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FixPatterns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FixPatterns.
     */
    skip?: number
    distinct?: FixPatternScalarFieldEnum | FixPatternScalarFieldEnum[]
  }

  /**
   * FixPattern create
   */
  export type FixPatternCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FixPattern
     */
    select?: FixPatternSelect<ExtArgs> | null
    /**
     * The data needed to create a FixPattern.
     */
    data: XOR<FixPatternCreateInput, FixPatternUncheckedCreateInput>
  }

  /**
   * FixPattern createMany
   */
  export type FixPatternCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many FixPatterns.
     */
    data: FixPatternCreateManyInput | FixPatternCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * FixPattern createManyAndReturn
   */
  export type FixPatternCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FixPattern
     */
    select?: FixPatternSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many FixPatterns.
     */
    data: FixPatternCreateManyInput | FixPatternCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * FixPattern update
   */
  export type FixPatternUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FixPattern
     */
    select?: FixPatternSelect<ExtArgs> | null
    /**
     * The data needed to update a FixPattern.
     */
    data: XOR<FixPatternUpdateInput, FixPatternUncheckedUpdateInput>
    /**
     * Choose, which FixPattern to update.
     */
    where: FixPatternWhereUniqueInput
  }

  /**
   * FixPattern updateMany
   */
  export type FixPatternUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update FixPatterns.
     */
    data: XOR<FixPatternUpdateManyMutationInput, FixPatternUncheckedUpdateManyInput>
    /**
     * Filter which FixPatterns to update
     */
    where?: FixPatternWhereInput
  }

  /**
   * FixPattern upsert
   */
  export type FixPatternUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FixPattern
     */
    select?: FixPatternSelect<ExtArgs> | null
    /**
     * The filter to search for the FixPattern to update in case it exists.
     */
    where: FixPatternWhereUniqueInput
    /**
     * In case the FixPattern found by the `where` argument doesn't exist, create a new FixPattern with this data.
     */
    create: XOR<FixPatternCreateInput, FixPatternUncheckedCreateInput>
    /**
     * In case the FixPattern was found with the provided `where` argument, update it with this data.
     */
    update: XOR<FixPatternUpdateInput, FixPatternUncheckedUpdateInput>
  }

  /**
   * FixPattern delete
   */
  export type FixPatternDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FixPattern
     */
    select?: FixPatternSelect<ExtArgs> | null
    /**
     * Filter which FixPattern to delete.
     */
    where: FixPatternWhereUniqueInput
  }

  /**
   * FixPattern deleteMany
   */
  export type FixPatternDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which FixPatterns to delete
     */
    where?: FixPatternWhereInput
  }

  /**
   * FixPattern without action
   */
  export type FixPatternDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FixPattern
     */
    select?: FixPatternSelect<ExtArgs> | null
  }


  /**
   * Model TestExecution
   */

  export type AggregateTestExecution = {
    _count: TestExecutionCountAggregateOutputType | null
    _avg: TestExecutionAvgAggregateOutputType | null
    _sum: TestExecutionSumAggregateOutputType | null
    _min: TestExecutionMinAggregateOutputType | null
    _max: TestExecutionMaxAggregateOutputType | null
  }

  export type TestExecutionAvgAggregateOutputType = {
    duration: number | null
  }

  export type TestExecutionSumAggregateOutputType = {
    duration: number | null
  }

  export type TestExecutionMinAggregateOutputType = {
    id: string | null
    testFileId: string | null
    executedAt: Date | null
    passed: boolean | null
    duration: number | null
    errorMessage: string | null
    environment: string | null
    commitHash: string | null
  }

  export type TestExecutionMaxAggregateOutputType = {
    id: string | null
    testFileId: string | null
    executedAt: Date | null
    passed: boolean | null
    duration: number | null
    errorMessage: string | null
    environment: string | null
    commitHash: string | null
  }

  export type TestExecutionCountAggregateOutputType = {
    id: number
    testFileId: number
    executedAt: number
    passed: number
    duration: number
    errorMessage: number
    testResults: number
    environment: number
    commitHash: number
    performance: number
    _all: number
  }


  export type TestExecutionAvgAggregateInputType = {
    duration?: true
  }

  export type TestExecutionSumAggregateInputType = {
    duration?: true
  }

  export type TestExecutionMinAggregateInputType = {
    id?: true
    testFileId?: true
    executedAt?: true
    passed?: true
    duration?: true
    errorMessage?: true
    environment?: true
    commitHash?: true
  }

  export type TestExecutionMaxAggregateInputType = {
    id?: true
    testFileId?: true
    executedAt?: true
    passed?: true
    duration?: true
    errorMessage?: true
    environment?: true
    commitHash?: true
  }

  export type TestExecutionCountAggregateInputType = {
    id?: true
    testFileId?: true
    executedAt?: true
    passed?: true
    duration?: true
    errorMessage?: true
    testResults?: true
    environment?: true
    commitHash?: true
    performance?: true
    _all?: true
  }

  export type TestExecutionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TestExecution to aggregate.
     */
    where?: TestExecutionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestExecutions to fetch.
     */
    orderBy?: TestExecutionOrderByWithRelationInput | TestExecutionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TestExecutionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestExecutions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestExecutions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TestExecutions
    **/
    _count?: true | TestExecutionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TestExecutionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TestExecutionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TestExecutionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TestExecutionMaxAggregateInputType
  }

  export type GetTestExecutionAggregateType<T extends TestExecutionAggregateArgs> = {
        [P in keyof T & keyof AggregateTestExecution]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTestExecution[P]>
      : GetScalarType<T[P], AggregateTestExecution[P]>
  }




  export type TestExecutionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TestExecutionWhereInput
    orderBy?: TestExecutionOrderByWithAggregationInput | TestExecutionOrderByWithAggregationInput[]
    by: TestExecutionScalarFieldEnum[] | TestExecutionScalarFieldEnum
    having?: TestExecutionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TestExecutionCountAggregateInputType | true
    _avg?: TestExecutionAvgAggregateInputType
    _sum?: TestExecutionSumAggregateInputType
    _min?: TestExecutionMinAggregateInputType
    _max?: TestExecutionMaxAggregateInputType
  }

  export type TestExecutionGroupByOutputType = {
    id: string
    testFileId: string
    executedAt: Date
    passed: boolean
    duration: number
    errorMessage: string | null
    testResults: JsonValue
    environment: string
    commitHash: string | null
    performance: JsonValue | null
    _count: TestExecutionCountAggregateOutputType | null
    _avg: TestExecutionAvgAggregateOutputType | null
    _sum: TestExecutionSumAggregateOutputType | null
    _min: TestExecutionMinAggregateOutputType | null
    _max: TestExecutionMaxAggregateOutputType | null
  }

  type GetTestExecutionGroupByPayload<T extends TestExecutionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TestExecutionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TestExecutionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TestExecutionGroupByOutputType[P]>
            : GetScalarType<T[P], TestExecutionGroupByOutputType[P]>
        }
      >
    >


  export type TestExecutionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    testFileId?: boolean
    executedAt?: boolean
    passed?: boolean
    duration?: boolean
    errorMessage?: boolean
    testResults?: boolean
    environment?: boolean
    commitHash?: boolean
    performance?: boolean
    testFile?: boolean | TestFileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["testExecution"]>

  export type TestExecutionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    testFileId?: boolean
    executedAt?: boolean
    passed?: boolean
    duration?: boolean
    errorMessage?: boolean
    testResults?: boolean
    environment?: boolean
    commitHash?: boolean
    performance?: boolean
    testFile?: boolean | TestFileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["testExecution"]>

  export type TestExecutionSelectScalar = {
    id?: boolean
    testFileId?: boolean
    executedAt?: boolean
    passed?: boolean
    duration?: boolean
    errorMessage?: boolean
    testResults?: boolean
    environment?: boolean
    commitHash?: boolean
    performance?: boolean
  }

  export type TestExecutionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    testFile?: boolean | TestFileDefaultArgs<ExtArgs>
  }
  export type TestExecutionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    testFile?: boolean | TestFileDefaultArgs<ExtArgs>
  }

  export type $TestExecutionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TestExecution"
    objects: {
      testFile: Prisma.$TestFilePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      testFileId: string
      executedAt: Date
      passed: boolean
      duration: number
      errorMessage: string | null
      testResults: Prisma.JsonValue
      environment: string
      commitHash: string | null
      performance: Prisma.JsonValue | null
    }, ExtArgs["result"]["testExecution"]>
    composites: {}
  }

  type TestExecutionGetPayload<S extends boolean | null | undefined | TestExecutionDefaultArgs> = $Result.GetResult<Prisma.$TestExecutionPayload, S>

  type TestExecutionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TestExecutionFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TestExecutionCountAggregateInputType | true
    }

  export interface TestExecutionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TestExecution'], meta: { name: 'TestExecution' } }
    /**
     * Find zero or one TestExecution that matches the filter.
     * @param {TestExecutionFindUniqueArgs} args - Arguments to find a TestExecution
     * @example
     * // Get one TestExecution
     * const testExecution = await prisma.testExecution.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TestExecutionFindUniqueArgs>(args: SelectSubset<T, TestExecutionFindUniqueArgs<ExtArgs>>): Prisma__TestExecutionClient<$Result.GetResult<Prisma.$TestExecutionPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one TestExecution that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {TestExecutionFindUniqueOrThrowArgs} args - Arguments to find a TestExecution
     * @example
     * // Get one TestExecution
     * const testExecution = await prisma.testExecution.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TestExecutionFindUniqueOrThrowArgs>(args: SelectSubset<T, TestExecutionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TestExecutionClient<$Result.GetResult<Prisma.$TestExecutionPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first TestExecution that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestExecutionFindFirstArgs} args - Arguments to find a TestExecution
     * @example
     * // Get one TestExecution
     * const testExecution = await prisma.testExecution.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TestExecutionFindFirstArgs>(args?: SelectSubset<T, TestExecutionFindFirstArgs<ExtArgs>>): Prisma__TestExecutionClient<$Result.GetResult<Prisma.$TestExecutionPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first TestExecution that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestExecutionFindFirstOrThrowArgs} args - Arguments to find a TestExecution
     * @example
     * // Get one TestExecution
     * const testExecution = await prisma.testExecution.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TestExecutionFindFirstOrThrowArgs>(args?: SelectSubset<T, TestExecutionFindFirstOrThrowArgs<ExtArgs>>): Prisma__TestExecutionClient<$Result.GetResult<Prisma.$TestExecutionPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more TestExecutions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestExecutionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TestExecutions
     * const testExecutions = await prisma.testExecution.findMany()
     * 
     * // Get first 10 TestExecutions
     * const testExecutions = await prisma.testExecution.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const testExecutionWithIdOnly = await prisma.testExecution.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TestExecutionFindManyArgs>(args?: SelectSubset<T, TestExecutionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TestExecutionPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a TestExecution.
     * @param {TestExecutionCreateArgs} args - Arguments to create a TestExecution.
     * @example
     * // Create one TestExecution
     * const TestExecution = await prisma.testExecution.create({
     *   data: {
     *     // ... data to create a TestExecution
     *   }
     * })
     * 
     */
    create<T extends TestExecutionCreateArgs>(args: SelectSubset<T, TestExecutionCreateArgs<ExtArgs>>): Prisma__TestExecutionClient<$Result.GetResult<Prisma.$TestExecutionPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many TestExecutions.
     * @param {TestExecutionCreateManyArgs} args - Arguments to create many TestExecutions.
     * @example
     * // Create many TestExecutions
     * const testExecution = await prisma.testExecution.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TestExecutionCreateManyArgs>(args?: SelectSubset<T, TestExecutionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TestExecutions and returns the data saved in the database.
     * @param {TestExecutionCreateManyAndReturnArgs} args - Arguments to create many TestExecutions.
     * @example
     * // Create many TestExecutions
     * const testExecution = await prisma.testExecution.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TestExecutions and only return the `id`
     * const testExecutionWithIdOnly = await prisma.testExecution.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TestExecutionCreateManyAndReturnArgs>(args?: SelectSubset<T, TestExecutionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TestExecutionPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a TestExecution.
     * @param {TestExecutionDeleteArgs} args - Arguments to delete one TestExecution.
     * @example
     * // Delete one TestExecution
     * const TestExecution = await prisma.testExecution.delete({
     *   where: {
     *     // ... filter to delete one TestExecution
     *   }
     * })
     * 
     */
    delete<T extends TestExecutionDeleteArgs>(args: SelectSubset<T, TestExecutionDeleteArgs<ExtArgs>>): Prisma__TestExecutionClient<$Result.GetResult<Prisma.$TestExecutionPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one TestExecution.
     * @param {TestExecutionUpdateArgs} args - Arguments to update one TestExecution.
     * @example
     * // Update one TestExecution
     * const testExecution = await prisma.testExecution.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TestExecutionUpdateArgs>(args: SelectSubset<T, TestExecutionUpdateArgs<ExtArgs>>): Prisma__TestExecutionClient<$Result.GetResult<Prisma.$TestExecutionPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more TestExecutions.
     * @param {TestExecutionDeleteManyArgs} args - Arguments to filter TestExecutions to delete.
     * @example
     * // Delete a few TestExecutions
     * const { count } = await prisma.testExecution.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TestExecutionDeleteManyArgs>(args?: SelectSubset<T, TestExecutionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TestExecutions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestExecutionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TestExecutions
     * const testExecution = await prisma.testExecution.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TestExecutionUpdateManyArgs>(args: SelectSubset<T, TestExecutionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one TestExecution.
     * @param {TestExecutionUpsertArgs} args - Arguments to update or create a TestExecution.
     * @example
     * // Update or create a TestExecution
     * const testExecution = await prisma.testExecution.upsert({
     *   create: {
     *     // ... data to create a TestExecution
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TestExecution we want to update
     *   }
     * })
     */
    upsert<T extends TestExecutionUpsertArgs>(args: SelectSubset<T, TestExecutionUpsertArgs<ExtArgs>>): Prisma__TestExecutionClient<$Result.GetResult<Prisma.$TestExecutionPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of TestExecutions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestExecutionCountArgs} args - Arguments to filter TestExecutions to count.
     * @example
     * // Count the number of TestExecutions
     * const count = await prisma.testExecution.count({
     *   where: {
     *     // ... the filter for the TestExecutions we want to count
     *   }
     * })
    **/
    count<T extends TestExecutionCountArgs>(
      args?: Subset<T, TestExecutionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TestExecutionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TestExecution.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestExecutionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TestExecutionAggregateArgs>(args: Subset<T, TestExecutionAggregateArgs>): Prisma.PrismaPromise<GetTestExecutionAggregateType<T>>

    /**
     * Group by TestExecution.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestExecutionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TestExecutionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TestExecutionGroupByArgs['orderBy'] }
        : { orderBy?: TestExecutionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TestExecutionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTestExecutionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TestExecution model
   */
  readonly fields: TestExecutionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TestExecution.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TestExecutionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    testFile<T extends TestFileDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TestFileDefaultArgs<ExtArgs>>): Prisma__TestFileClient<$Result.GetResult<Prisma.$TestFilePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TestExecution model
   */ 
  interface TestExecutionFieldRefs {
    readonly id: FieldRef<"TestExecution", 'String'>
    readonly testFileId: FieldRef<"TestExecution", 'String'>
    readonly executedAt: FieldRef<"TestExecution", 'DateTime'>
    readonly passed: FieldRef<"TestExecution", 'Boolean'>
    readonly duration: FieldRef<"TestExecution", 'Float'>
    readonly errorMessage: FieldRef<"TestExecution", 'String'>
    readonly testResults: FieldRef<"TestExecution", 'Json'>
    readonly environment: FieldRef<"TestExecution", 'String'>
    readonly commitHash: FieldRef<"TestExecution", 'String'>
    readonly performance: FieldRef<"TestExecution", 'Json'>
  }
    

  // Custom InputTypes
  /**
   * TestExecution findUnique
   */
  export type TestExecutionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestExecution
     */
    select?: TestExecutionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestExecutionInclude<ExtArgs> | null
    /**
     * Filter, which TestExecution to fetch.
     */
    where: TestExecutionWhereUniqueInput
  }

  /**
   * TestExecution findUniqueOrThrow
   */
  export type TestExecutionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestExecution
     */
    select?: TestExecutionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestExecutionInclude<ExtArgs> | null
    /**
     * Filter, which TestExecution to fetch.
     */
    where: TestExecutionWhereUniqueInput
  }

  /**
   * TestExecution findFirst
   */
  export type TestExecutionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestExecution
     */
    select?: TestExecutionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestExecutionInclude<ExtArgs> | null
    /**
     * Filter, which TestExecution to fetch.
     */
    where?: TestExecutionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestExecutions to fetch.
     */
    orderBy?: TestExecutionOrderByWithRelationInput | TestExecutionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TestExecutions.
     */
    cursor?: TestExecutionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestExecutions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestExecutions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TestExecutions.
     */
    distinct?: TestExecutionScalarFieldEnum | TestExecutionScalarFieldEnum[]
  }

  /**
   * TestExecution findFirstOrThrow
   */
  export type TestExecutionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestExecution
     */
    select?: TestExecutionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestExecutionInclude<ExtArgs> | null
    /**
     * Filter, which TestExecution to fetch.
     */
    where?: TestExecutionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestExecutions to fetch.
     */
    orderBy?: TestExecutionOrderByWithRelationInput | TestExecutionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TestExecutions.
     */
    cursor?: TestExecutionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestExecutions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestExecutions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TestExecutions.
     */
    distinct?: TestExecutionScalarFieldEnum | TestExecutionScalarFieldEnum[]
  }

  /**
   * TestExecution findMany
   */
  export type TestExecutionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestExecution
     */
    select?: TestExecutionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestExecutionInclude<ExtArgs> | null
    /**
     * Filter, which TestExecutions to fetch.
     */
    where?: TestExecutionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestExecutions to fetch.
     */
    orderBy?: TestExecutionOrderByWithRelationInput | TestExecutionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TestExecutions.
     */
    cursor?: TestExecutionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestExecutions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestExecutions.
     */
    skip?: number
    distinct?: TestExecutionScalarFieldEnum | TestExecutionScalarFieldEnum[]
  }

  /**
   * TestExecution create
   */
  export type TestExecutionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestExecution
     */
    select?: TestExecutionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestExecutionInclude<ExtArgs> | null
    /**
     * The data needed to create a TestExecution.
     */
    data: XOR<TestExecutionCreateInput, TestExecutionUncheckedCreateInput>
  }

  /**
   * TestExecution createMany
   */
  export type TestExecutionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TestExecutions.
     */
    data: TestExecutionCreateManyInput | TestExecutionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TestExecution createManyAndReturn
   */
  export type TestExecutionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestExecution
     */
    select?: TestExecutionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many TestExecutions.
     */
    data: TestExecutionCreateManyInput | TestExecutionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestExecutionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TestExecution update
   */
  export type TestExecutionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestExecution
     */
    select?: TestExecutionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestExecutionInclude<ExtArgs> | null
    /**
     * The data needed to update a TestExecution.
     */
    data: XOR<TestExecutionUpdateInput, TestExecutionUncheckedUpdateInput>
    /**
     * Choose, which TestExecution to update.
     */
    where: TestExecutionWhereUniqueInput
  }

  /**
   * TestExecution updateMany
   */
  export type TestExecutionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TestExecutions.
     */
    data: XOR<TestExecutionUpdateManyMutationInput, TestExecutionUncheckedUpdateManyInput>
    /**
     * Filter which TestExecutions to update
     */
    where?: TestExecutionWhereInput
  }

  /**
   * TestExecution upsert
   */
  export type TestExecutionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestExecution
     */
    select?: TestExecutionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestExecutionInclude<ExtArgs> | null
    /**
     * The filter to search for the TestExecution to update in case it exists.
     */
    where: TestExecutionWhereUniqueInput
    /**
     * In case the TestExecution found by the `where` argument doesn't exist, create a new TestExecution with this data.
     */
    create: XOR<TestExecutionCreateInput, TestExecutionUncheckedCreateInput>
    /**
     * In case the TestExecution was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TestExecutionUpdateInput, TestExecutionUncheckedUpdateInput>
  }

  /**
   * TestExecution delete
   */
  export type TestExecutionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestExecution
     */
    select?: TestExecutionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestExecutionInclude<ExtArgs> | null
    /**
     * Filter which TestExecution to delete.
     */
    where: TestExecutionWhereUniqueInput
  }

  /**
   * TestExecution deleteMany
   */
  export type TestExecutionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TestExecutions to delete
     */
    where?: TestExecutionWhereInput
  }

  /**
   * TestExecution without action
   */
  export type TestExecutionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestExecution
     */
    select?: TestExecutionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestExecutionInclude<ExtArgs> | null
  }


  /**
   * Model TestCoverage
   */

  export type AggregateTestCoverage = {
    _count: TestCoverageCountAggregateOutputType | null
    _avg: TestCoverageAvgAggregateOutputType | null
    _sum: TestCoverageSumAggregateOutputType | null
    _min: TestCoverageMinAggregateOutputType | null
    _max: TestCoverageMaxAggregateOutputType | null
  }

  export type TestCoverageAvgAggregateOutputType = {
    coveragePercent: number | null
  }

  export type TestCoverageSumAggregateOutputType = {
    coveragePercent: number | null
  }

  export type TestCoverageMinAggregateOutputType = {
    id: string | null
    testFileId: string | null
    measuredAt: Date | null
    coveragePercent: number | null
    coverageType: string | null
  }

  export type TestCoverageMaxAggregateOutputType = {
    id: string | null
    testFileId: string | null
    measuredAt: Date | null
    coveragePercent: number | null
    coverageType: string | null
  }

  export type TestCoverageCountAggregateOutputType = {
    id: number
    testFileId: number
    measuredAt: number
    coveragePercent: number
    linesCovered: number
    linesUncovered: number
    branchCoverage: number
    functionCoverage: number
    suggestedAreas: number
    coverageType: number
    _all: number
  }


  export type TestCoverageAvgAggregateInputType = {
    coveragePercent?: true
  }

  export type TestCoverageSumAggregateInputType = {
    coveragePercent?: true
  }

  export type TestCoverageMinAggregateInputType = {
    id?: true
    testFileId?: true
    measuredAt?: true
    coveragePercent?: true
    coverageType?: true
  }

  export type TestCoverageMaxAggregateInputType = {
    id?: true
    testFileId?: true
    measuredAt?: true
    coveragePercent?: true
    coverageType?: true
  }

  export type TestCoverageCountAggregateInputType = {
    id?: true
    testFileId?: true
    measuredAt?: true
    coveragePercent?: true
    linesCovered?: true
    linesUncovered?: true
    branchCoverage?: true
    functionCoverage?: true
    suggestedAreas?: true
    coverageType?: true
    _all?: true
  }

  export type TestCoverageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TestCoverage to aggregate.
     */
    where?: TestCoverageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestCoverages to fetch.
     */
    orderBy?: TestCoverageOrderByWithRelationInput | TestCoverageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TestCoverageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestCoverages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestCoverages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TestCoverages
    **/
    _count?: true | TestCoverageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TestCoverageAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TestCoverageSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TestCoverageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TestCoverageMaxAggregateInputType
  }

  export type GetTestCoverageAggregateType<T extends TestCoverageAggregateArgs> = {
        [P in keyof T & keyof AggregateTestCoverage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTestCoverage[P]>
      : GetScalarType<T[P], AggregateTestCoverage[P]>
  }




  export type TestCoverageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TestCoverageWhereInput
    orderBy?: TestCoverageOrderByWithAggregationInput | TestCoverageOrderByWithAggregationInput[]
    by: TestCoverageScalarFieldEnum[] | TestCoverageScalarFieldEnum
    having?: TestCoverageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TestCoverageCountAggregateInputType | true
    _avg?: TestCoverageAvgAggregateInputType
    _sum?: TestCoverageSumAggregateInputType
    _min?: TestCoverageMinAggregateInputType
    _max?: TestCoverageMaxAggregateInputType
  }

  export type TestCoverageGroupByOutputType = {
    id: string
    testFileId: string
    measuredAt: Date
    coveragePercent: number
    linesCovered: JsonValue
    linesUncovered: JsonValue
    branchCoverage: JsonValue | null
    functionCoverage: JsonValue | null
    suggestedAreas: JsonValue | null
    coverageType: string
    _count: TestCoverageCountAggregateOutputType | null
    _avg: TestCoverageAvgAggregateOutputType | null
    _sum: TestCoverageSumAggregateOutputType | null
    _min: TestCoverageMinAggregateOutputType | null
    _max: TestCoverageMaxAggregateOutputType | null
  }

  type GetTestCoverageGroupByPayload<T extends TestCoverageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TestCoverageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TestCoverageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TestCoverageGroupByOutputType[P]>
            : GetScalarType<T[P], TestCoverageGroupByOutputType[P]>
        }
      >
    >


  export type TestCoverageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    testFileId?: boolean
    measuredAt?: boolean
    coveragePercent?: boolean
    linesCovered?: boolean
    linesUncovered?: boolean
    branchCoverage?: boolean
    functionCoverage?: boolean
    suggestedAreas?: boolean
    coverageType?: boolean
    testFile?: boolean | TestFileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["testCoverage"]>

  export type TestCoverageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    testFileId?: boolean
    measuredAt?: boolean
    coveragePercent?: boolean
    linesCovered?: boolean
    linesUncovered?: boolean
    branchCoverage?: boolean
    functionCoverage?: boolean
    suggestedAreas?: boolean
    coverageType?: boolean
    testFile?: boolean | TestFileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["testCoverage"]>

  export type TestCoverageSelectScalar = {
    id?: boolean
    testFileId?: boolean
    measuredAt?: boolean
    coveragePercent?: boolean
    linesCovered?: boolean
    linesUncovered?: boolean
    branchCoverage?: boolean
    functionCoverage?: boolean
    suggestedAreas?: boolean
    coverageType?: boolean
  }

  export type TestCoverageInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    testFile?: boolean | TestFileDefaultArgs<ExtArgs>
  }
  export type TestCoverageIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    testFile?: boolean | TestFileDefaultArgs<ExtArgs>
  }

  export type $TestCoveragePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TestCoverage"
    objects: {
      testFile: Prisma.$TestFilePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      testFileId: string
      measuredAt: Date
      coveragePercent: number
      linesCovered: Prisma.JsonValue
      linesUncovered: Prisma.JsonValue
      branchCoverage: Prisma.JsonValue | null
      functionCoverage: Prisma.JsonValue | null
      suggestedAreas: Prisma.JsonValue | null
      coverageType: string
    }, ExtArgs["result"]["testCoverage"]>
    composites: {}
  }

  type TestCoverageGetPayload<S extends boolean | null | undefined | TestCoverageDefaultArgs> = $Result.GetResult<Prisma.$TestCoveragePayload, S>

  type TestCoverageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TestCoverageFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TestCoverageCountAggregateInputType | true
    }

  export interface TestCoverageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TestCoverage'], meta: { name: 'TestCoverage' } }
    /**
     * Find zero or one TestCoverage that matches the filter.
     * @param {TestCoverageFindUniqueArgs} args - Arguments to find a TestCoverage
     * @example
     * // Get one TestCoverage
     * const testCoverage = await prisma.testCoverage.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TestCoverageFindUniqueArgs>(args: SelectSubset<T, TestCoverageFindUniqueArgs<ExtArgs>>): Prisma__TestCoverageClient<$Result.GetResult<Prisma.$TestCoveragePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one TestCoverage that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {TestCoverageFindUniqueOrThrowArgs} args - Arguments to find a TestCoverage
     * @example
     * // Get one TestCoverage
     * const testCoverage = await prisma.testCoverage.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TestCoverageFindUniqueOrThrowArgs>(args: SelectSubset<T, TestCoverageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TestCoverageClient<$Result.GetResult<Prisma.$TestCoveragePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first TestCoverage that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestCoverageFindFirstArgs} args - Arguments to find a TestCoverage
     * @example
     * // Get one TestCoverage
     * const testCoverage = await prisma.testCoverage.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TestCoverageFindFirstArgs>(args?: SelectSubset<T, TestCoverageFindFirstArgs<ExtArgs>>): Prisma__TestCoverageClient<$Result.GetResult<Prisma.$TestCoveragePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first TestCoverage that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestCoverageFindFirstOrThrowArgs} args - Arguments to find a TestCoverage
     * @example
     * // Get one TestCoverage
     * const testCoverage = await prisma.testCoverage.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TestCoverageFindFirstOrThrowArgs>(args?: SelectSubset<T, TestCoverageFindFirstOrThrowArgs<ExtArgs>>): Prisma__TestCoverageClient<$Result.GetResult<Prisma.$TestCoveragePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more TestCoverages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestCoverageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TestCoverages
     * const testCoverages = await prisma.testCoverage.findMany()
     * 
     * // Get first 10 TestCoverages
     * const testCoverages = await prisma.testCoverage.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const testCoverageWithIdOnly = await prisma.testCoverage.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TestCoverageFindManyArgs>(args?: SelectSubset<T, TestCoverageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TestCoveragePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a TestCoverage.
     * @param {TestCoverageCreateArgs} args - Arguments to create a TestCoverage.
     * @example
     * // Create one TestCoverage
     * const TestCoverage = await prisma.testCoverage.create({
     *   data: {
     *     // ... data to create a TestCoverage
     *   }
     * })
     * 
     */
    create<T extends TestCoverageCreateArgs>(args: SelectSubset<T, TestCoverageCreateArgs<ExtArgs>>): Prisma__TestCoverageClient<$Result.GetResult<Prisma.$TestCoveragePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many TestCoverages.
     * @param {TestCoverageCreateManyArgs} args - Arguments to create many TestCoverages.
     * @example
     * // Create many TestCoverages
     * const testCoverage = await prisma.testCoverage.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TestCoverageCreateManyArgs>(args?: SelectSubset<T, TestCoverageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TestCoverages and returns the data saved in the database.
     * @param {TestCoverageCreateManyAndReturnArgs} args - Arguments to create many TestCoverages.
     * @example
     * // Create many TestCoverages
     * const testCoverage = await prisma.testCoverage.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TestCoverages and only return the `id`
     * const testCoverageWithIdOnly = await prisma.testCoverage.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TestCoverageCreateManyAndReturnArgs>(args?: SelectSubset<T, TestCoverageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TestCoveragePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a TestCoverage.
     * @param {TestCoverageDeleteArgs} args - Arguments to delete one TestCoverage.
     * @example
     * // Delete one TestCoverage
     * const TestCoverage = await prisma.testCoverage.delete({
     *   where: {
     *     // ... filter to delete one TestCoverage
     *   }
     * })
     * 
     */
    delete<T extends TestCoverageDeleteArgs>(args: SelectSubset<T, TestCoverageDeleteArgs<ExtArgs>>): Prisma__TestCoverageClient<$Result.GetResult<Prisma.$TestCoveragePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one TestCoverage.
     * @param {TestCoverageUpdateArgs} args - Arguments to update one TestCoverage.
     * @example
     * // Update one TestCoverage
     * const testCoverage = await prisma.testCoverage.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TestCoverageUpdateArgs>(args: SelectSubset<T, TestCoverageUpdateArgs<ExtArgs>>): Prisma__TestCoverageClient<$Result.GetResult<Prisma.$TestCoveragePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more TestCoverages.
     * @param {TestCoverageDeleteManyArgs} args - Arguments to filter TestCoverages to delete.
     * @example
     * // Delete a few TestCoverages
     * const { count } = await prisma.testCoverage.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TestCoverageDeleteManyArgs>(args?: SelectSubset<T, TestCoverageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TestCoverages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestCoverageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TestCoverages
     * const testCoverage = await prisma.testCoverage.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TestCoverageUpdateManyArgs>(args: SelectSubset<T, TestCoverageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one TestCoverage.
     * @param {TestCoverageUpsertArgs} args - Arguments to update or create a TestCoverage.
     * @example
     * // Update or create a TestCoverage
     * const testCoverage = await prisma.testCoverage.upsert({
     *   create: {
     *     // ... data to create a TestCoverage
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TestCoverage we want to update
     *   }
     * })
     */
    upsert<T extends TestCoverageUpsertArgs>(args: SelectSubset<T, TestCoverageUpsertArgs<ExtArgs>>): Prisma__TestCoverageClient<$Result.GetResult<Prisma.$TestCoveragePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of TestCoverages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestCoverageCountArgs} args - Arguments to filter TestCoverages to count.
     * @example
     * // Count the number of TestCoverages
     * const count = await prisma.testCoverage.count({
     *   where: {
     *     // ... the filter for the TestCoverages we want to count
     *   }
     * })
    **/
    count<T extends TestCoverageCountArgs>(
      args?: Subset<T, TestCoverageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TestCoverageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TestCoverage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestCoverageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TestCoverageAggregateArgs>(args: Subset<T, TestCoverageAggregateArgs>): Prisma.PrismaPromise<GetTestCoverageAggregateType<T>>

    /**
     * Group by TestCoverage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestCoverageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TestCoverageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TestCoverageGroupByArgs['orderBy'] }
        : { orderBy?: TestCoverageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TestCoverageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTestCoverageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TestCoverage model
   */
  readonly fields: TestCoverageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TestCoverage.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TestCoverageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    testFile<T extends TestFileDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TestFileDefaultArgs<ExtArgs>>): Prisma__TestFileClient<$Result.GetResult<Prisma.$TestFilePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TestCoverage model
   */ 
  interface TestCoverageFieldRefs {
    readonly id: FieldRef<"TestCoverage", 'String'>
    readonly testFileId: FieldRef<"TestCoverage", 'String'>
    readonly measuredAt: FieldRef<"TestCoverage", 'DateTime'>
    readonly coveragePercent: FieldRef<"TestCoverage", 'Float'>
    readonly linesCovered: FieldRef<"TestCoverage", 'Json'>
    readonly linesUncovered: FieldRef<"TestCoverage", 'Json'>
    readonly branchCoverage: FieldRef<"TestCoverage", 'Json'>
    readonly functionCoverage: FieldRef<"TestCoverage", 'Json'>
    readonly suggestedAreas: FieldRef<"TestCoverage", 'Json'>
    readonly coverageType: FieldRef<"TestCoverage", 'String'>
  }
    

  // Custom InputTypes
  /**
   * TestCoverage findUnique
   */
  export type TestCoverageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestCoverage
     */
    select?: TestCoverageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestCoverageInclude<ExtArgs> | null
    /**
     * Filter, which TestCoverage to fetch.
     */
    where: TestCoverageWhereUniqueInput
  }

  /**
   * TestCoverage findUniqueOrThrow
   */
  export type TestCoverageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestCoverage
     */
    select?: TestCoverageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestCoverageInclude<ExtArgs> | null
    /**
     * Filter, which TestCoverage to fetch.
     */
    where: TestCoverageWhereUniqueInput
  }

  /**
   * TestCoverage findFirst
   */
  export type TestCoverageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestCoverage
     */
    select?: TestCoverageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestCoverageInclude<ExtArgs> | null
    /**
     * Filter, which TestCoverage to fetch.
     */
    where?: TestCoverageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestCoverages to fetch.
     */
    orderBy?: TestCoverageOrderByWithRelationInput | TestCoverageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TestCoverages.
     */
    cursor?: TestCoverageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestCoverages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestCoverages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TestCoverages.
     */
    distinct?: TestCoverageScalarFieldEnum | TestCoverageScalarFieldEnum[]
  }

  /**
   * TestCoverage findFirstOrThrow
   */
  export type TestCoverageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestCoverage
     */
    select?: TestCoverageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestCoverageInclude<ExtArgs> | null
    /**
     * Filter, which TestCoverage to fetch.
     */
    where?: TestCoverageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestCoverages to fetch.
     */
    orderBy?: TestCoverageOrderByWithRelationInput | TestCoverageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TestCoverages.
     */
    cursor?: TestCoverageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestCoverages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestCoverages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TestCoverages.
     */
    distinct?: TestCoverageScalarFieldEnum | TestCoverageScalarFieldEnum[]
  }

  /**
   * TestCoverage findMany
   */
  export type TestCoverageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestCoverage
     */
    select?: TestCoverageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestCoverageInclude<ExtArgs> | null
    /**
     * Filter, which TestCoverages to fetch.
     */
    where?: TestCoverageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestCoverages to fetch.
     */
    orderBy?: TestCoverageOrderByWithRelationInput | TestCoverageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TestCoverages.
     */
    cursor?: TestCoverageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestCoverages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestCoverages.
     */
    skip?: number
    distinct?: TestCoverageScalarFieldEnum | TestCoverageScalarFieldEnum[]
  }

  /**
   * TestCoverage create
   */
  export type TestCoverageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestCoverage
     */
    select?: TestCoverageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestCoverageInclude<ExtArgs> | null
    /**
     * The data needed to create a TestCoverage.
     */
    data: XOR<TestCoverageCreateInput, TestCoverageUncheckedCreateInput>
  }

  /**
   * TestCoverage createMany
   */
  export type TestCoverageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TestCoverages.
     */
    data: TestCoverageCreateManyInput | TestCoverageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TestCoverage createManyAndReturn
   */
  export type TestCoverageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestCoverage
     */
    select?: TestCoverageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many TestCoverages.
     */
    data: TestCoverageCreateManyInput | TestCoverageCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestCoverageIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TestCoverage update
   */
  export type TestCoverageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestCoverage
     */
    select?: TestCoverageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestCoverageInclude<ExtArgs> | null
    /**
     * The data needed to update a TestCoverage.
     */
    data: XOR<TestCoverageUpdateInput, TestCoverageUncheckedUpdateInput>
    /**
     * Choose, which TestCoverage to update.
     */
    where: TestCoverageWhereUniqueInput
  }

  /**
   * TestCoverage updateMany
   */
  export type TestCoverageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TestCoverages.
     */
    data: XOR<TestCoverageUpdateManyMutationInput, TestCoverageUncheckedUpdateManyInput>
    /**
     * Filter which TestCoverages to update
     */
    where?: TestCoverageWhereInput
  }

  /**
   * TestCoverage upsert
   */
  export type TestCoverageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestCoverage
     */
    select?: TestCoverageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestCoverageInclude<ExtArgs> | null
    /**
     * The filter to search for the TestCoverage to update in case it exists.
     */
    where: TestCoverageWhereUniqueInput
    /**
     * In case the TestCoverage found by the `where` argument doesn't exist, create a new TestCoverage with this data.
     */
    create: XOR<TestCoverageCreateInput, TestCoverageUncheckedCreateInput>
    /**
     * In case the TestCoverage was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TestCoverageUpdateInput, TestCoverageUncheckedUpdateInput>
  }

  /**
   * TestCoverage delete
   */
  export type TestCoverageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestCoverage
     */
    select?: TestCoverageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestCoverageInclude<ExtArgs> | null
    /**
     * Filter which TestCoverage to delete.
     */
    where: TestCoverageWhereUniqueInput
  }

  /**
   * TestCoverage deleteMany
   */
  export type TestCoverageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TestCoverages to delete
     */
    where?: TestCoverageWhereInput
  }

  /**
   * TestCoverage without action
   */
  export type TestCoverageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestCoverage
     */
    select?: TestCoverageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestCoverageInclude<ExtArgs> | null
  }


  /**
   * Model TestFix
   */

  export type AggregateTestFix = {
    _count: TestFixCountAggregateOutputType | null
    _avg: TestFixAvgAggregateOutputType | null
    _sum: TestFixSumAggregateOutputType | null
    _min: TestFixMinAggregateOutputType | null
    _max: TestFixMaxAggregateOutputType | null
  }

  export type TestFixAvgAggregateOutputType = {
    confidenceScore: number | null
    impactScore: number | null
  }

  export type TestFixSumAggregateOutputType = {
    confidenceScore: number | null
    impactScore: number | null
  }

  export type TestFixMinAggregateOutputType = {
    id: string | null
    testFileId: string | null
    appliedAt: Date | null
    fixType: $Enums.FixType | null
    problem: string | null
    solution: string | null
    successful: boolean | null
    confidenceScore: number | null
    patternUsed: string | null
    impactScore: number | null
  }

  export type TestFixMaxAggregateOutputType = {
    id: string | null
    testFileId: string | null
    appliedAt: Date | null
    fixType: $Enums.FixType | null
    problem: string | null
    solution: string | null
    successful: boolean | null
    confidenceScore: number | null
    patternUsed: string | null
    impactScore: number | null
  }

  export type TestFixCountAggregateOutputType = {
    id: number
    testFileId: number
    appliedAt: number
    fixType: number
    problem: number
    solution: number
    successful: number
    confidenceScore: number
    beforeState: number
    afterState: number
    patternUsed: number
    impactScore: number
    _all: number
  }


  export type TestFixAvgAggregateInputType = {
    confidenceScore?: true
    impactScore?: true
  }

  export type TestFixSumAggregateInputType = {
    confidenceScore?: true
    impactScore?: true
  }

  export type TestFixMinAggregateInputType = {
    id?: true
    testFileId?: true
    appliedAt?: true
    fixType?: true
    problem?: true
    solution?: true
    successful?: true
    confidenceScore?: true
    patternUsed?: true
    impactScore?: true
  }

  export type TestFixMaxAggregateInputType = {
    id?: true
    testFileId?: true
    appliedAt?: true
    fixType?: true
    problem?: true
    solution?: true
    successful?: true
    confidenceScore?: true
    patternUsed?: true
    impactScore?: true
  }

  export type TestFixCountAggregateInputType = {
    id?: true
    testFileId?: true
    appliedAt?: true
    fixType?: true
    problem?: true
    solution?: true
    successful?: true
    confidenceScore?: true
    beforeState?: true
    afterState?: true
    patternUsed?: true
    impactScore?: true
    _all?: true
  }

  export type TestFixAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TestFix to aggregate.
     */
    where?: TestFixWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestFixes to fetch.
     */
    orderBy?: TestFixOrderByWithRelationInput | TestFixOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TestFixWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestFixes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestFixes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TestFixes
    **/
    _count?: true | TestFixCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TestFixAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TestFixSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TestFixMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TestFixMaxAggregateInputType
  }

  export type GetTestFixAggregateType<T extends TestFixAggregateArgs> = {
        [P in keyof T & keyof AggregateTestFix]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTestFix[P]>
      : GetScalarType<T[P], AggregateTestFix[P]>
  }




  export type TestFixGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TestFixWhereInput
    orderBy?: TestFixOrderByWithAggregationInput | TestFixOrderByWithAggregationInput[]
    by: TestFixScalarFieldEnum[] | TestFixScalarFieldEnum
    having?: TestFixScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TestFixCountAggregateInputType | true
    _avg?: TestFixAvgAggregateInputType
    _sum?: TestFixSumAggregateInputType
    _min?: TestFixMinAggregateInputType
    _max?: TestFixMaxAggregateInputType
  }

  export type TestFixGroupByOutputType = {
    id: string
    testFileId: string
    appliedAt: Date
    fixType: $Enums.FixType
    problem: string
    solution: string
    successful: boolean
    confidenceScore: number
    beforeState: JsonValue
    afterState: JsonValue
    patternUsed: string | null
    impactScore: number
    _count: TestFixCountAggregateOutputType | null
    _avg: TestFixAvgAggregateOutputType | null
    _sum: TestFixSumAggregateOutputType | null
    _min: TestFixMinAggregateOutputType | null
    _max: TestFixMaxAggregateOutputType | null
  }

  type GetTestFixGroupByPayload<T extends TestFixGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TestFixGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TestFixGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TestFixGroupByOutputType[P]>
            : GetScalarType<T[P], TestFixGroupByOutputType[P]>
        }
      >
    >


  export type TestFixSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    testFileId?: boolean
    appliedAt?: boolean
    fixType?: boolean
    problem?: boolean
    solution?: boolean
    successful?: boolean
    confidenceScore?: boolean
    beforeState?: boolean
    afterState?: boolean
    patternUsed?: boolean
    impactScore?: boolean
    testFile?: boolean | TestFileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["testFix"]>

  export type TestFixSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    testFileId?: boolean
    appliedAt?: boolean
    fixType?: boolean
    problem?: boolean
    solution?: boolean
    successful?: boolean
    confidenceScore?: boolean
    beforeState?: boolean
    afterState?: boolean
    patternUsed?: boolean
    impactScore?: boolean
    testFile?: boolean | TestFileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["testFix"]>

  export type TestFixSelectScalar = {
    id?: boolean
    testFileId?: boolean
    appliedAt?: boolean
    fixType?: boolean
    problem?: boolean
    solution?: boolean
    successful?: boolean
    confidenceScore?: boolean
    beforeState?: boolean
    afterState?: boolean
    patternUsed?: boolean
    impactScore?: boolean
  }

  export type TestFixInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    testFile?: boolean | TestFileDefaultArgs<ExtArgs>
  }
  export type TestFixIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    testFile?: boolean | TestFileDefaultArgs<ExtArgs>
  }

  export type $TestFixPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TestFix"
    objects: {
      testFile: Prisma.$TestFilePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      testFileId: string
      appliedAt: Date
      fixType: $Enums.FixType
      problem: string
      solution: string
      successful: boolean
      confidenceScore: number
      beforeState: Prisma.JsonValue
      afterState: Prisma.JsonValue
      patternUsed: string | null
      impactScore: number
    }, ExtArgs["result"]["testFix"]>
    composites: {}
  }

  type TestFixGetPayload<S extends boolean | null | undefined | TestFixDefaultArgs> = $Result.GetResult<Prisma.$TestFixPayload, S>

  type TestFixCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TestFixFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TestFixCountAggregateInputType | true
    }

  export interface TestFixDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TestFix'], meta: { name: 'TestFix' } }
    /**
     * Find zero or one TestFix that matches the filter.
     * @param {TestFixFindUniqueArgs} args - Arguments to find a TestFix
     * @example
     * // Get one TestFix
     * const testFix = await prisma.testFix.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TestFixFindUniqueArgs>(args: SelectSubset<T, TestFixFindUniqueArgs<ExtArgs>>): Prisma__TestFixClient<$Result.GetResult<Prisma.$TestFixPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one TestFix that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {TestFixFindUniqueOrThrowArgs} args - Arguments to find a TestFix
     * @example
     * // Get one TestFix
     * const testFix = await prisma.testFix.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TestFixFindUniqueOrThrowArgs>(args: SelectSubset<T, TestFixFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TestFixClient<$Result.GetResult<Prisma.$TestFixPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first TestFix that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestFixFindFirstArgs} args - Arguments to find a TestFix
     * @example
     * // Get one TestFix
     * const testFix = await prisma.testFix.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TestFixFindFirstArgs>(args?: SelectSubset<T, TestFixFindFirstArgs<ExtArgs>>): Prisma__TestFixClient<$Result.GetResult<Prisma.$TestFixPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first TestFix that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestFixFindFirstOrThrowArgs} args - Arguments to find a TestFix
     * @example
     * // Get one TestFix
     * const testFix = await prisma.testFix.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TestFixFindFirstOrThrowArgs>(args?: SelectSubset<T, TestFixFindFirstOrThrowArgs<ExtArgs>>): Prisma__TestFixClient<$Result.GetResult<Prisma.$TestFixPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more TestFixes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestFixFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TestFixes
     * const testFixes = await prisma.testFix.findMany()
     * 
     * // Get first 10 TestFixes
     * const testFixes = await prisma.testFix.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const testFixWithIdOnly = await prisma.testFix.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TestFixFindManyArgs>(args?: SelectSubset<T, TestFixFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TestFixPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a TestFix.
     * @param {TestFixCreateArgs} args - Arguments to create a TestFix.
     * @example
     * // Create one TestFix
     * const TestFix = await prisma.testFix.create({
     *   data: {
     *     // ... data to create a TestFix
     *   }
     * })
     * 
     */
    create<T extends TestFixCreateArgs>(args: SelectSubset<T, TestFixCreateArgs<ExtArgs>>): Prisma__TestFixClient<$Result.GetResult<Prisma.$TestFixPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many TestFixes.
     * @param {TestFixCreateManyArgs} args - Arguments to create many TestFixes.
     * @example
     * // Create many TestFixes
     * const testFix = await prisma.testFix.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TestFixCreateManyArgs>(args?: SelectSubset<T, TestFixCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TestFixes and returns the data saved in the database.
     * @param {TestFixCreateManyAndReturnArgs} args - Arguments to create many TestFixes.
     * @example
     * // Create many TestFixes
     * const testFix = await prisma.testFix.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TestFixes and only return the `id`
     * const testFixWithIdOnly = await prisma.testFix.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TestFixCreateManyAndReturnArgs>(args?: SelectSubset<T, TestFixCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TestFixPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a TestFix.
     * @param {TestFixDeleteArgs} args - Arguments to delete one TestFix.
     * @example
     * // Delete one TestFix
     * const TestFix = await prisma.testFix.delete({
     *   where: {
     *     // ... filter to delete one TestFix
     *   }
     * })
     * 
     */
    delete<T extends TestFixDeleteArgs>(args: SelectSubset<T, TestFixDeleteArgs<ExtArgs>>): Prisma__TestFixClient<$Result.GetResult<Prisma.$TestFixPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one TestFix.
     * @param {TestFixUpdateArgs} args - Arguments to update one TestFix.
     * @example
     * // Update one TestFix
     * const testFix = await prisma.testFix.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TestFixUpdateArgs>(args: SelectSubset<T, TestFixUpdateArgs<ExtArgs>>): Prisma__TestFixClient<$Result.GetResult<Prisma.$TestFixPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more TestFixes.
     * @param {TestFixDeleteManyArgs} args - Arguments to filter TestFixes to delete.
     * @example
     * // Delete a few TestFixes
     * const { count } = await prisma.testFix.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TestFixDeleteManyArgs>(args?: SelectSubset<T, TestFixDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TestFixes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestFixUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TestFixes
     * const testFix = await prisma.testFix.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TestFixUpdateManyArgs>(args: SelectSubset<T, TestFixUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one TestFix.
     * @param {TestFixUpsertArgs} args - Arguments to update or create a TestFix.
     * @example
     * // Update or create a TestFix
     * const testFix = await prisma.testFix.upsert({
     *   create: {
     *     // ... data to create a TestFix
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TestFix we want to update
     *   }
     * })
     */
    upsert<T extends TestFixUpsertArgs>(args: SelectSubset<T, TestFixUpsertArgs<ExtArgs>>): Prisma__TestFixClient<$Result.GetResult<Prisma.$TestFixPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of TestFixes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestFixCountArgs} args - Arguments to filter TestFixes to count.
     * @example
     * // Count the number of TestFixes
     * const count = await prisma.testFix.count({
     *   where: {
     *     // ... the filter for the TestFixes we want to count
     *   }
     * })
    **/
    count<T extends TestFixCountArgs>(
      args?: Subset<T, TestFixCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TestFixCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TestFix.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestFixAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TestFixAggregateArgs>(args: Subset<T, TestFixAggregateArgs>): Prisma.PrismaPromise<GetTestFixAggregateType<T>>

    /**
     * Group by TestFix.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestFixGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TestFixGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TestFixGroupByArgs['orderBy'] }
        : { orderBy?: TestFixGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TestFixGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTestFixGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TestFix model
   */
  readonly fields: TestFixFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TestFix.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TestFixClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    testFile<T extends TestFileDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TestFileDefaultArgs<ExtArgs>>): Prisma__TestFileClient<$Result.GetResult<Prisma.$TestFilePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TestFix model
   */ 
  interface TestFixFieldRefs {
    readonly id: FieldRef<"TestFix", 'String'>
    readonly testFileId: FieldRef<"TestFix", 'String'>
    readonly appliedAt: FieldRef<"TestFix", 'DateTime'>
    readonly fixType: FieldRef<"TestFix", 'FixType'>
    readonly problem: FieldRef<"TestFix", 'String'>
    readonly solution: FieldRef<"TestFix", 'String'>
    readonly successful: FieldRef<"TestFix", 'Boolean'>
    readonly confidenceScore: FieldRef<"TestFix", 'Float'>
    readonly beforeState: FieldRef<"TestFix", 'Json'>
    readonly afterState: FieldRef<"TestFix", 'Json'>
    readonly patternUsed: FieldRef<"TestFix", 'String'>
    readonly impactScore: FieldRef<"TestFix", 'Float'>
  }
    

  // Custom InputTypes
  /**
   * TestFix findUnique
   */
  export type TestFixFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestFix
     */
    select?: TestFixSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestFixInclude<ExtArgs> | null
    /**
     * Filter, which TestFix to fetch.
     */
    where: TestFixWhereUniqueInput
  }

  /**
   * TestFix findUniqueOrThrow
   */
  export type TestFixFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestFix
     */
    select?: TestFixSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestFixInclude<ExtArgs> | null
    /**
     * Filter, which TestFix to fetch.
     */
    where: TestFixWhereUniqueInput
  }

  /**
   * TestFix findFirst
   */
  export type TestFixFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestFix
     */
    select?: TestFixSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestFixInclude<ExtArgs> | null
    /**
     * Filter, which TestFix to fetch.
     */
    where?: TestFixWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestFixes to fetch.
     */
    orderBy?: TestFixOrderByWithRelationInput | TestFixOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TestFixes.
     */
    cursor?: TestFixWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestFixes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestFixes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TestFixes.
     */
    distinct?: TestFixScalarFieldEnum | TestFixScalarFieldEnum[]
  }

  /**
   * TestFix findFirstOrThrow
   */
  export type TestFixFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestFix
     */
    select?: TestFixSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestFixInclude<ExtArgs> | null
    /**
     * Filter, which TestFix to fetch.
     */
    where?: TestFixWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestFixes to fetch.
     */
    orderBy?: TestFixOrderByWithRelationInput | TestFixOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TestFixes.
     */
    cursor?: TestFixWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestFixes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestFixes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TestFixes.
     */
    distinct?: TestFixScalarFieldEnum | TestFixScalarFieldEnum[]
  }

  /**
   * TestFix findMany
   */
  export type TestFixFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestFix
     */
    select?: TestFixSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestFixInclude<ExtArgs> | null
    /**
     * Filter, which TestFixes to fetch.
     */
    where?: TestFixWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestFixes to fetch.
     */
    orderBy?: TestFixOrderByWithRelationInput | TestFixOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TestFixes.
     */
    cursor?: TestFixWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestFixes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestFixes.
     */
    skip?: number
    distinct?: TestFixScalarFieldEnum | TestFixScalarFieldEnum[]
  }

  /**
   * TestFix create
   */
  export type TestFixCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestFix
     */
    select?: TestFixSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestFixInclude<ExtArgs> | null
    /**
     * The data needed to create a TestFix.
     */
    data: XOR<TestFixCreateInput, TestFixUncheckedCreateInput>
  }

  /**
   * TestFix createMany
   */
  export type TestFixCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TestFixes.
     */
    data: TestFixCreateManyInput | TestFixCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TestFix createManyAndReturn
   */
  export type TestFixCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestFix
     */
    select?: TestFixSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many TestFixes.
     */
    data: TestFixCreateManyInput | TestFixCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestFixIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TestFix update
   */
  export type TestFixUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestFix
     */
    select?: TestFixSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestFixInclude<ExtArgs> | null
    /**
     * The data needed to update a TestFix.
     */
    data: XOR<TestFixUpdateInput, TestFixUncheckedUpdateInput>
    /**
     * Choose, which TestFix to update.
     */
    where: TestFixWhereUniqueInput
  }

  /**
   * TestFix updateMany
   */
  export type TestFixUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TestFixes.
     */
    data: XOR<TestFixUpdateManyMutationInput, TestFixUncheckedUpdateManyInput>
    /**
     * Filter which TestFixes to update
     */
    where?: TestFixWhereInput
  }

  /**
   * TestFix upsert
   */
  export type TestFixUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestFix
     */
    select?: TestFixSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestFixInclude<ExtArgs> | null
    /**
     * The filter to search for the TestFix to update in case it exists.
     */
    where: TestFixWhereUniqueInput
    /**
     * In case the TestFix found by the `where` argument doesn't exist, create a new TestFix with this data.
     */
    create: XOR<TestFixCreateInput, TestFixUncheckedCreateInput>
    /**
     * In case the TestFix was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TestFixUpdateInput, TestFixUncheckedUpdateInput>
  }

  /**
   * TestFix delete
   */
  export type TestFixDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestFix
     */
    select?: TestFixSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestFixInclude<ExtArgs> | null
    /**
     * Filter which TestFix to delete.
     */
    where: TestFixWhereUniqueInput
  }

  /**
   * TestFix deleteMany
   */
  export type TestFixDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TestFixes to delete
     */
    where?: TestFixWhereInput
  }

  /**
   * TestFix without action
   */
  export type TestFixDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestFix
     */
    select?: TestFixSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestFixInclude<ExtArgs> | null
  }


  /**
   * Model TestGeneration
   */

  export type AggregateTestGeneration = {
    _count: TestGenerationCountAggregateOutputType | null
    _avg: TestGenerationAvgAggregateOutputType | null
    _sum: TestGenerationSumAggregateOutputType | null
    _min: TestGenerationMinAggregateOutputType | null
    _max: TestGenerationMaxAggregateOutputType | null
  }

  export type TestGenerationAvgAggregateOutputType = {
    coverageImprovement: number | null
  }

  export type TestGenerationSumAggregateOutputType = {
    coverageImprovement: number | null
  }

  export type TestGenerationMinAggregateOutputType = {
    id: string | null
    testFileId: string | null
    generatedAt: Date | null
    generationType: $Enums.GenerationType | null
    accepted: boolean | null
    targetArea: string | null
    coverageImprovement: number | null
    generationStrategy: string | null
  }

  export type TestGenerationMaxAggregateOutputType = {
    id: string | null
    testFileId: string | null
    generatedAt: Date | null
    generationType: $Enums.GenerationType | null
    accepted: boolean | null
    targetArea: string | null
    coverageImprovement: number | null
    generationStrategy: string | null
  }

  export type TestGenerationCountAggregateOutputType = {
    id: number
    testFileId: number
    generatedAt: number
    generationType: number
    newTests: number
    accepted: number
    targetArea: number
    coverageImprovement: number
    generationStrategy: number
    context: number
    _all: number
  }


  export type TestGenerationAvgAggregateInputType = {
    coverageImprovement?: true
  }

  export type TestGenerationSumAggregateInputType = {
    coverageImprovement?: true
  }

  export type TestGenerationMinAggregateInputType = {
    id?: true
    testFileId?: true
    generatedAt?: true
    generationType?: true
    accepted?: true
    targetArea?: true
    coverageImprovement?: true
    generationStrategy?: true
  }

  export type TestGenerationMaxAggregateInputType = {
    id?: true
    testFileId?: true
    generatedAt?: true
    generationType?: true
    accepted?: true
    targetArea?: true
    coverageImprovement?: true
    generationStrategy?: true
  }

  export type TestGenerationCountAggregateInputType = {
    id?: true
    testFileId?: true
    generatedAt?: true
    generationType?: true
    newTests?: true
    accepted?: true
    targetArea?: true
    coverageImprovement?: true
    generationStrategy?: true
    context?: true
    _all?: true
  }

  export type TestGenerationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TestGeneration to aggregate.
     */
    where?: TestGenerationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestGenerations to fetch.
     */
    orderBy?: TestGenerationOrderByWithRelationInput | TestGenerationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TestGenerationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestGenerations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestGenerations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TestGenerations
    **/
    _count?: true | TestGenerationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TestGenerationAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TestGenerationSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TestGenerationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TestGenerationMaxAggregateInputType
  }

  export type GetTestGenerationAggregateType<T extends TestGenerationAggregateArgs> = {
        [P in keyof T & keyof AggregateTestGeneration]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTestGeneration[P]>
      : GetScalarType<T[P], AggregateTestGeneration[P]>
  }




  export type TestGenerationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TestGenerationWhereInput
    orderBy?: TestGenerationOrderByWithAggregationInput | TestGenerationOrderByWithAggregationInput[]
    by: TestGenerationScalarFieldEnum[] | TestGenerationScalarFieldEnum
    having?: TestGenerationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TestGenerationCountAggregateInputType | true
    _avg?: TestGenerationAvgAggregateInputType
    _sum?: TestGenerationSumAggregateInputType
    _min?: TestGenerationMinAggregateInputType
    _max?: TestGenerationMaxAggregateInputType
  }

  export type TestGenerationGroupByOutputType = {
    id: string
    testFileId: string
    generatedAt: Date
    generationType: $Enums.GenerationType
    newTests: JsonValue
    accepted: boolean
    targetArea: string
    coverageImprovement: number
    generationStrategy: string
    context: JsonValue
    _count: TestGenerationCountAggregateOutputType | null
    _avg: TestGenerationAvgAggregateOutputType | null
    _sum: TestGenerationSumAggregateOutputType | null
    _min: TestGenerationMinAggregateOutputType | null
    _max: TestGenerationMaxAggregateOutputType | null
  }

  type GetTestGenerationGroupByPayload<T extends TestGenerationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TestGenerationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TestGenerationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TestGenerationGroupByOutputType[P]>
            : GetScalarType<T[P], TestGenerationGroupByOutputType[P]>
        }
      >
    >


  export type TestGenerationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    testFileId?: boolean
    generatedAt?: boolean
    generationType?: boolean
    newTests?: boolean
    accepted?: boolean
    targetArea?: boolean
    coverageImprovement?: boolean
    generationStrategy?: boolean
    context?: boolean
    testFile?: boolean | TestFileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["testGeneration"]>

  export type TestGenerationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    testFileId?: boolean
    generatedAt?: boolean
    generationType?: boolean
    newTests?: boolean
    accepted?: boolean
    targetArea?: boolean
    coverageImprovement?: boolean
    generationStrategy?: boolean
    context?: boolean
    testFile?: boolean | TestFileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["testGeneration"]>

  export type TestGenerationSelectScalar = {
    id?: boolean
    testFileId?: boolean
    generatedAt?: boolean
    generationType?: boolean
    newTests?: boolean
    accepted?: boolean
    targetArea?: boolean
    coverageImprovement?: boolean
    generationStrategy?: boolean
    context?: boolean
  }

  export type TestGenerationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    testFile?: boolean | TestFileDefaultArgs<ExtArgs>
  }
  export type TestGenerationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    testFile?: boolean | TestFileDefaultArgs<ExtArgs>
  }

  export type $TestGenerationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TestGeneration"
    objects: {
      testFile: Prisma.$TestFilePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      testFileId: string
      generatedAt: Date
      generationType: $Enums.GenerationType
      newTests: Prisma.JsonValue
      accepted: boolean
      targetArea: string
      coverageImprovement: number
      generationStrategy: string
      context: Prisma.JsonValue
    }, ExtArgs["result"]["testGeneration"]>
    composites: {}
  }

  type TestGenerationGetPayload<S extends boolean | null | undefined | TestGenerationDefaultArgs> = $Result.GetResult<Prisma.$TestGenerationPayload, S>

  type TestGenerationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TestGenerationFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TestGenerationCountAggregateInputType | true
    }

  export interface TestGenerationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TestGeneration'], meta: { name: 'TestGeneration' } }
    /**
     * Find zero or one TestGeneration that matches the filter.
     * @param {TestGenerationFindUniqueArgs} args - Arguments to find a TestGeneration
     * @example
     * // Get one TestGeneration
     * const testGeneration = await prisma.testGeneration.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TestGenerationFindUniqueArgs>(args: SelectSubset<T, TestGenerationFindUniqueArgs<ExtArgs>>): Prisma__TestGenerationClient<$Result.GetResult<Prisma.$TestGenerationPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one TestGeneration that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {TestGenerationFindUniqueOrThrowArgs} args - Arguments to find a TestGeneration
     * @example
     * // Get one TestGeneration
     * const testGeneration = await prisma.testGeneration.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TestGenerationFindUniqueOrThrowArgs>(args: SelectSubset<T, TestGenerationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TestGenerationClient<$Result.GetResult<Prisma.$TestGenerationPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first TestGeneration that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestGenerationFindFirstArgs} args - Arguments to find a TestGeneration
     * @example
     * // Get one TestGeneration
     * const testGeneration = await prisma.testGeneration.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TestGenerationFindFirstArgs>(args?: SelectSubset<T, TestGenerationFindFirstArgs<ExtArgs>>): Prisma__TestGenerationClient<$Result.GetResult<Prisma.$TestGenerationPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first TestGeneration that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestGenerationFindFirstOrThrowArgs} args - Arguments to find a TestGeneration
     * @example
     * // Get one TestGeneration
     * const testGeneration = await prisma.testGeneration.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TestGenerationFindFirstOrThrowArgs>(args?: SelectSubset<T, TestGenerationFindFirstOrThrowArgs<ExtArgs>>): Prisma__TestGenerationClient<$Result.GetResult<Prisma.$TestGenerationPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more TestGenerations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestGenerationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TestGenerations
     * const testGenerations = await prisma.testGeneration.findMany()
     * 
     * // Get first 10 TestGenerations
     * const testGenerations = await prisma.testGeneration.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const testGenerationWithIdOnly = await prisma.testGeneration.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TestGenerationFindManyArgs>(args?: SelectSubset<T, TestGenerationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TestGenerationPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a TestGeneration.
     * @param {TestGenerationCreateArgs} args - Arguments to create a TestGeneration.
     * @example
     * // Create one TestGeneration
     * const TestGeneration = await prisma.testGeneration.create({
     *   data: {
     *     // ... data to create a TestGeneration
     *   }
     * })
     * 
     */
    create<T extends TestGenerationCreateArgs>(args: SelectSubset<T, TestGenerationCreateArgs<ExtArgs>>): Prisma__TestGenerationClient<$Result.GetResult<Prisma.$TestGenerationPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many TestGenerations.
     * @param {TestGenerationCreateManyArgs} args - Arguments to create many TestGenerations.
     * @example
     * // Create many TestGenerations
     * const testGeneration = await prisma.testGeneration.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TestGenerationCreateManyArgs>(args?: SelectSubset<T, TestGenerationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TestGenerations and returns the data saved in the database.
     * @param {TestGenerationCreateManyAndReturnArgs} args - Arguments to create many TestGenerations.
     * @example
     * // Create many TestGenerations
     * const testGeneration = await prisma.testGeneration.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TestGenerations and only return the `id`
     * const testGenerationWithIdOnly = await prisma.testGeneration.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TestGenerationCreateManyAndReturnArgs>(args?: SelectSubset<T, TestGenerationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TestGenerationPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a TestGeneration.
     * @param {TestGenerationDeleteArgs} args - Arguments to delete one TestGeneration.
     * @example
     * // Delete one TestGeneration
     * const TestGeneration = await prisma.testGeneration.delete({
     *   where: {
     *     // ... filter to delete one TestGeneration
     *   }
     * })
     * 
     */
    delete<T extends TestGenerationDeleteArgs>(args: SelectSubset<T, TestGenerationDeleteArgs<ExtArgs>>): Prisma__TestGenerationClient<$Result.GetResult<Prisma.$TestGenerationPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one TestGeneration.
     * @param {TestGenerationUpdateArgs} args - Arguments to update one TestGeneration.
     * @example
     * // Update one TestGeneration
     * const testGeneration = await prisma.testGeneration.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TestGenerationUpdateArgs>(args: SelectSubset<T, TestGenerationUpdateArgs<ExtArgs>>): Prisma__TestGenerationClient<$Result.GetResult<Prisma.$TestGenerationPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more TestGenerations.
     * @param {TestGenerationDeleteManyArgs} args - Arguments to filter TestGenerations to delete.
     * @example
     * // Delete a few TestGenerations
     * const { count } = await prisma.testGeneration.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TestGenerationDeleteManyArgs>(args?: SelectSubset<T, TestGenerationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TestGenerations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestGenerationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TestGenerations
     * const testGeneration = await prisma.testGeneration.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TestGenerationUpdateManyArgs>(args: SelectSubset<T, TestGenerationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one TestGeneration.
     * @param {TestGenerationUpsertArgs} args - Arguments to update or create a TestGeneration.
     * @example
     * // Update or create a TestGeneration
     * const testGeneration = await prisma.testGeneration.upsert({
     *   create: {
     *     // ... data to create a TestGeneration
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TestGeneration we want to update
     *   }
     * })
     */
    upsert<T extends TestGenerationUpsertArgs>(args: SelectSubset<T, TestGenerationUpsertArgs<ExtArgs>>): Prisma__TestGenerationClient<$Result.GetResult<Prisma.$TestGenerationPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of TestGenerations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestGenerationCountArgs} args - Arguments to filter TestGenerations to count.
     * @example
     * // Count the number of TestGenerations
     * const count = await prisma.testGeneration.count({
     *   where: {
     *     // ... the filter for the TestGenerations we want to count
     *   }
     * })
    **/
    count<T extends TestGenerationCountArgs>(
      args?: Subset<T, TestGenerationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TestGenerationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TestGeneration.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestGenerationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TestGenerationAggregateArgs>(args: Subset<T, TestGenerationAggregateArgs>): Prisma.PrismaPromise<GetTestGenerationAggregateType<T>>

    /**
     * Group by TestGeneration.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestGenerationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TestGenerationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TestGenerationGroupByArgs['orderBy'] }
        : { orderBy?: TestGenerationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TestGenerationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTestGenerationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TestGeneration model
   */
  readonly fields: TestGenerationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TestGeneration.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TestGenerationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    testFile<T extends TestFileDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TestFileDefaultArgs<ExtArgs>>): Prisma__TestFileClient<$Result.GetResult<Prisma.$TestFilePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TestGeneration model
   */ 
  interface TestGenerationFieldRefs {
    readonly id: FieldRef<"TestGeneration", 'String'>
    readonly testFileId: FieldRef<"TestGeneration", 'String'>
    readonly generatedAt: FieldRef<"TestGeneration", 'DateTime'>
    readonly generationType: FieldRef<"TestGeneration", 'GenerationType'>
    readonly newTests: FieldRef<"TestGeneration", 'Json'>
    readonly accepted: FieldRef<"TestGeneration", 'Boolean'>
    readonly targetArea: FieldRef<"TestGeneration", 'String'>
    readonly coverageImprovement: FieldRef<"TestGeneration", 'Float'>
    readonly generationStrategy: FieldRef<"TestGeneration", 'String'>
    readonly context: FieldRef<"TestGeneration", 'Json'>
  }
    

  // Custom InputTypes
  /**
   * TestGeneration findUnique
   */
  export type TestGenerationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestGeneration
     */
    select?: TestGenerationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestGenerationInclude<ExtArgs> | null
    /**
     * Filter, which TestGeneration to fetch.
     */
    where: TestGenerationWhereUniqueInput
  }

  /**
   * TestGeneration findUniqueOrThrow
   */
  export type TestGenerationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestGeneration
     */
    select?: TestGenerationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestGenerationInclude<ExtArgs> | null
    /**
     * Filter, which TestGeneration to fetch.
     */
    where: TestGenerationWhereUniqueInput
  }

  /**
   * TestGeneration findFirst
   */
  export type TestGenerationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestGeneration
     */
    select?: TestGenerationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestGenerationInclude<ExtArgs> | null
    /**
     * Filter, which TestGeneration to fetch.
     */
    where?: TestGenerationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestGenerations to fetch.
     */
    orderBy?: TestGenerationOrderByWithRelationInput | TestGenerationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TestGenerations.
     */
    cursor?: TestGenerationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestGenerations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestGenerations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TestGenerations.
     */
    distinct?: TestGenerationScalarFieldEnum | TestGenerationScalarFieldEnum[]
  }

  /**
   * TestGeneration findFirstOrThrow
   */
  export type TestGenerationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestGeneration
     */
    select?: TestGenerationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestGenerationInclude<ExtArgs> | null
    /**
     * Filter, which TestGeneration to fetch.
     */
    where?: TestGenerationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestGenerations to fetch.
     */
    orderBy?: TestGenerationOrderByWithRelationInput | TestGenerationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TestGenerations.
     */
    cursor?: TestGenerationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestGenerations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestGenerations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TestGenerations.
     */
    distinct?: TestGenerationScalarFieldEnum | TestGenerationScalarFieldEnum[]
  }

  /**
   * TestGeneration findMany
   */
  export type TestGenerationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestGeneration
     */
    select?: TestGenerationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestGenerationInclude<ExtArgs> | null
    /**
     * Filter, which TestGenerations to fetch.
     */
    where?: TestGenerationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestGenerations to fetch.
     */
    orderBy?: TestGenerationOrderByWithRelationInput | TestGenerationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TestGenerations.
     */
    cursor?: TestGenerationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestGenerations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestGenerations.
     */
    skip?: number
    distinct?: TestGenerationScalarFieldEnum | TestGenerationScalarFieldEnum[]
  }

  /**
   * TestGeneration create
   */
  export type TestGenerationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestGeneration
     */
    select?: TestGenerationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestGenerationInclude<ExtArgs> | null
    /**
     * The data needed to create a TestGeneration.
     */
    data: XOR<TestGenerationCreateInput, TestGenerationUncheckedCreateInput>
  }

  /**
   * TestGeneration createMany
   */
  export type TestGenerationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TestGenerations.
     */
    data: TestGenerationCreateManyInput | TestGenerationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TestGeneration createManyAndReturn
   */
  export type TestGenerationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestGeneration
     */
    select?: TestGenerationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many TestGenerations.
     */
    data: TestGenerationCreateManyInput | TestGenerationCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestGenerationIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TestGeneration update
   */
  export type TestGenerationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestGeneration
     */
    select?: TestGenerationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestGenerationInclude<ExtArgs> | null
    /**
     * The data needed to update a TestGeneration.
     */
    data: XOR<TestGenerationUpdateInput, TestGenerationUncheckedUpdateInput>
    /**
     * Choose, which TestGeneration to update.
     */
    where: TestGenerationWhereUniqueInput
  }

  /**
   * TestGeneration updateMany
   */
  export type TestGenerationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TestGenerations.
     */
    data: XOR<TestGenerationUpdateManyMutationInput, TestGenerationUncheckedUpdateManyInput>
    /**
     * Filter which TestGenerations to update
     */
    where?: TestGenerationWhereInput
  }

  /**
   * TestGeneration upsert
   */
  export type TestGenerationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestGeneration
     */
    select?: TestGenerationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestGenerationInclude<ExtArgs> | null
    /**
     * The filter to search for the TestGeneration to update in case it exists.
     */
    where: TestGenerationWhereUniqueInput
    /**
     * In case the TestGeneration found by the `where` argument doesn't exist, create a new TestGeneration with this data.
     */
    create: XOR<TestGenerationCreateInput, TestGenerationUncheckedCreateInput>
    /**
     * In case the TestGeneration was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TestGenerationUpdateInput, TestGenerationUncheckedUpdateInput>
  }

  /**
   * TestGeneration delete
   */
  export type TestGenerationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestGeneration
     */
    select?: TestGenerationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestGenerationInclude<ExtArgs> | null
    /**
     * Filter which TestGeneration to delete.
     */
    where: TestGenerationWhereUniqueInput
  }

  /**
   * TestGeneration deleteMany
   */
  export type TestGenerationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TestGenerations to delete
     */
    where?: TestGenerationWhereInput
  }

  /**
   * TestGeneration without action
   */
  export type TestGenerationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestGeneration
     */
    select?: TestGenerationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestGenerationInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const AnalysisSessionScalarFieldEnum: {
    id: 'id',
    startedAt: 'startedAt',
    endedAt: 'endedAt',
    status: 'status',
    context: 'context',
    decisions: 'decisions',
    operations: 'operations'
  };

  export type AnalysisSessionScalarFieldEnum = (typeof AnalysisSessionScalarFieldEnum)[keyof typeof AnalysisSessionScalarFieldEnum]


  export const TestFileScalarFieldEnum: {
    id: 'id',
    filePath: 'filePath',
    fileName: 'fileName',
    firstSeen: 'firstSeen',
    lastUpdated: 'lastUpdated',
    totalRuns: 'totalRuns',
    avgPassRate: 'avgPassRate',
    currentPassRate: 'currentPassRate',
    avgDuration: 'avgDuration',
    currentCoverage: 'currentCoverage',
    avgCoverage: 'avgCoverage',
    totalFixes: 'totalFixes',
    flakyTests: 'flakyTests',
    metadata: 'metadata',
    healthScore: 'healthScore',
    totalTests: 'totalTests',
    criticalTests: 'criticalTests',
    lastFailureReason: 'lastFailureReason'
  };

  export type TestFileScalarFieldEnum = (typeof TestFileScalarFieldEnum)[keyof typeof TestFileScalarFieldEnum]


  export const TestAnalysisScalarFieldEnum: {
    id: 'id',
    sessionId: 'sessionId',
    testFileId: 'testFileId',
    patterns: 'patterns',
    antiPatterns: 'antiPatterns',
    suggestions: 'suggestions',
    context: 'context',
    timestamp: 'timestamp'
  };

  export type TestAnalysisScalarFieldEnum = (typeof TestAnalysisScalarFieldEnum)[keyof typeof TestAnalysisScalarFieldEnum]


  export const TestPatternScalarFieldEnum: {
    id: 'id',
    type: 'type',
    pattern: 'pattern',
    context: 'context',
    successRate: 'successRate',
    usageCount: 'usageCount',
    lastUsed: 'lastUsed',
    createdAt: 'createdAt'
  };

  export type TestPatternScalarFieldEnum = (typeof TestPatternScalarFieldEnum)[keyof typeof TestPatternScalarFieldEnum]


  export const FixPatternScalarFieldEnum: {
    id: 'id',
    problem: 'problem',
    solution: 'solution',
    context: 'context',
    successRate: 'successRate',
    usageCount: 'usageCount',
    lastUsed: 'lastUsed',
    createdAt: 'createdAt'
  };

  export type FixPatternScalarFieldEnum = (typeof FixPatternScalarFieldEnum)[keyof typeof FixPatternScalarFieldEnum]


  export const TestExecutionScalarFieldEnum: {
    id: 'id',
    testFileId: 'testFileId',
    executedAt: 'executedAt',
    passed: 'passed',
    duration: 'duration',
    errorMessage: 'errorMessage',
    testResults: 'testResults',
    environment: 'environment',
    commitHash: 'commitHash',
    performance: 'performance'
  };

  export type TestExecutionScalarFieldEnum = (typeof TestExecutionScalarFieldEnum)[keyof typeof TestExecutionScalarFieldEnum]


  export const TestCoverageScalarFieldEnum: {
    id: 'id',
    testFileId: 'testFileId',
    measuredAt: 'measuredAt',
    coveragePercent: 'coveragePercent',
    linesCovered: 'linesCovered',
    linesUncovered: 'linesUncovered',
    branchCoverage: 'branchCoverage',
    functionCoverage: 'functionCoverage',
    suggestedAreas: 'suggestedAreas',
    coverageType: 'coverageType'
  };

  export type TestCoverageScalarFieldEnum = (typeof TestCoverageScalarFieldEnum)[keyof typeof TestCoverageScalarFieldEnum]


  export const TestFixScalarFieldEnum: {
    id: 'id',
    testFileId: 'testFileId',
    appliedAt: 'appliedAt',
    fixType: 'fixType',
    problem: 'problem',
    solution: 'solution',
    successful: 'successful',
    confidenceScore: 'confidenceScore',
    beforeState: 'beforeState',
    afterState: 'afterState',
    patternUsed: 'patternUsed',
    impactScore: 'impactScore'
  };

  export type TestFixScalarFieldEnum = (typeof TestFixScalarFieldEnum)[keyof typeof TestFixScalarFieldEnum]


  export const TestGenerationScalarFieldEnum: {
    id: 'id',
    testFileId: 'testFileId',
    generatedAt: 'generatedAt',
    generationType: 'generationType',
    newTests: 'newTests',
    accepted: 'accepted',
    targetArea: 'targetArea',
    coverageImprovement: 'coverageImprovement',
    generationStrategy: 'generationStrategy',
    context: 'context'
  };

  export type TestGenerationScalarFieldEnum = (typeof TestGenerationScalarFieldEnum)[keyof typeof TestGenerationScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'SessionStatus'
   */
  export type EnumSessionStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SessionStatus'>
    


  /**
   * Reference to a field of type 'SessionStatus[]'
   */
  export type ListEnumSessionStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SessionStatus[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'Json[]'
   */
  export type ListJsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'TestHealthScore'
   */
  export type EnumTestHealthScoreFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TestHealthScore'>
    


  /**
   * Reference to a field of type 'TestHealthScore[]'
   */
  export type ListEnumTestHealthScoreFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TestHealthScore[]'>
    


  /**
   * Reference to a field of type 'PatternType'
   */
  export type EnumPatternTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PatternType'>
    


  /**
   * Reference to a field of type 'PatternType[]'
   */
  export type ListEnumPatternTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PatternType[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'FixType'
   */
  export type EnumFixTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'FixType'>
    


  /**
   * Reference to a field of type 'FixType[]'
   */
  export type ListEnumFixTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'FixType[]'>
    


  /**
   * Reference to a field of type 'GenerationType'
   */
  export type EnumGenerationTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'GenerationType'>
    


  /**
   * Reference to a field of type 'GenerationType[]'
   */
  export type ListEnumGenerationTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'GenerationType[]'>
    
  /**
   * Deep Input Types
   */


  export type AnalysisSessionWhereInput = {
    AND?: AnalysisSessionWhereInput | AnalysisSessionWhereInput[]
    OR?: AnalysisSessionWhereInput[]
    NOT?: AnalysisSessionWhereInput | AnalysisSessionWhereInput[]
    id?: StringFilter<"AnalysisSession"> | string
    startedAt?: DateTimeFilter<"AnalysisSession"> | Date | string
    endedAt?: DateTimeNullableFilter<"AnalysisSession"> | Date | string | null
    status?: EnumSessionStatusFilter<"AnalysisSession"> | $Enums.SessionStatus
    context?: JsonNullableFilter<"AnalysisSession">
    decisions?: JsonNullableListFilter<"AnalysisSession">
    operations?: JsonNullableListFilter<"AnalysisSession">
    testFiles?: TestFileListRelationFilter
    analyses?: TestAnalysisListRelationFilter
  }

  export type AnalysisSessionOrderByWithRelationInput = {
    id?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrderInput | SortOrder
    status?: SortOrder
    context?: SortOrderInput | SortOrder
    decisions?: SortOrder
    operations?: SortOrder
    testFiles?: TestFileOrderByRelationAggregateInput
    analyses?: TestAnalysisOrderByRelationAggregateInput
  }

  export type AnalysisSessionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: AnalysisSessionWhereInput | AnalysisSessionWhereInput[]
    OR?: AnalysisSessionWhereInput[]
    NOT?: AnalysisSessionWhereInput | AnalysisSessionWhereInput[]
    startedAt?: DateTimeFilter<"AnalysisSession"> | Date | string
    endedAt?: DateTimeNullableFilter<"AnalysisSession"> | Date | string | null
    status?: EnumSessionStatusFilter<"AnalysisSession"> | $Enums.SessionStatus
    context?: JsonNullableFilter<"AnalysisSession">
    decisions?: JsonNullableListFilter<"AnalysisSession">
    operations?: JsonNullableListFilter<"AnalysisSession">
    testFiles?: TestFileListRelationFilter
    analyses?: TestAnalysisListRelationFilter
  }, "id">

  export type AnalysisSessionOrderByWithAggregationInput = {
    id?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrderInput | SortOrder
    status?: SortOrder
    context?: SortOrderInput | SortOrder
    decisions?: SortOrder
    operations?: SortOrder
    _count?: AnalysisSessionCountOrderByAggregateInput
    _max?: AnalysisSessionMaxOrderByAggregateInput
    _min?: AnalysisSessionMinOrderByAggregateInput
  }

  export type AnalysisSessionScalarWhereWithAggregatesInput = {
    AND?: AnalysisSessionScalarWhereWithAggregatesInput | AnalysisSessionScalarWhereWithAggregatesInput[]
    OR?: AnalysisSessionScalarWhereWithAggregatesInput[]
    NOT?: AnalysisSessionScalarWhereWithAggregatesInput | AnalysisSessionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"AnalysisSession"> | string
    startedAt?: DateTimeWithAggregatesFilter<"AnalysisSession"> | Date | string
    endedAt?: DateTimeNullableWithAggregatesFilter<"AnalysisSession"> | Date | string | null
    status?: EnumSessionStatusWithAggregatesFilter<"AnalysisSession"> | $Enums.SessionStatus
    context?: JsonNullableWithAggregatesFilter<"AnalysisSession">
    decisions?: JsonNullableListFilter<"AnalysisSession">
    operations?: JsonNullableListFilter<"AnalysisSession">
  }

  export type TestFileWhereInput = {
    AND?: TestFileWhereInput | TestFileWhereInput[]
    OR?: TestFileWhereInput[]
    NOT?: TestFileWhereInput | TestFileWhereInput[]
    id?: StringFilter<"TestFile"> | string
    filePath?: StringFilter<"TestFile"> | string
    fileName?: StringFilter<"TestFile"> | string
    firstSeen?: DateTimeFilter<"TestFile"> | Date | string
    lastUpdated?: DateTimeFilter<"TestFile"> | Date | string
    totalRuns?: IntFilter<"TestFile"> | number
    avgPassRate?: FloatFilter<"TestFile"> | number
    currentPassRate?: FloatFilter<"TestFile"> | number
    avgDuration?: FloatFilter<"TestFile"> | number
    currentCoverage?: FloatFilter<"TestFile"> | number
    avgCoverage?: FloatFilter<"TestFile"> | number
    totalFixes?: IntFilter<"TestFile"> | number
    flakyTests?: IntFilter<"TestFile"> | number
    metadata?: JsonNullableFilter<"TestFile">
    healthScore?: EnumTestHealthScoreFilter<"TestFile"> | $Enums.TestHealthScore
    totalTests?: IntFilter<"TestFile"> | number
    criticalTests?: IntFilter<"TestFile"> | number
    lastFailureReason?: StringNullableFilter<"TestFile"> | string | null
    sessions?: AnalysisSessionListRelationFilter
    executions?: TestExecutionListRelationFilter
    coverage?: TestCoverageListRelationFilter
    fixes?: TestFixListRelationFilter
    generations?: TestGenerationListRelationFilter
    analyses?: TestAnalysisListRelationFilter
  }

  export type TestFileOrderByWithRelationInput = {
    id?: SortOrder
    filePath?: SortOrder
    fileName?: SortOrder
    firstSeen?: SortOrder
    lastUpdated?: SortOrder
    totalRuns?: SortOrder
    avgPassRate?: SortOrder
    currentPassRate?: SortOrder
    avgDuration?: SortOrder
    currentCoverage?: SortOrder
    avgCoverage?: SortOrder
    totalFixes?: SortOrder
    flakyTests?: SortOrder
    metadata?: SortOrderInput | SortOrder
    healthScore?: SortOrder
    totalTests?: SortOrder
    criticalTests?: SortOrder
    lastFailureReason?: SortOrderInput | SortOrder
    sessions?: AnalysisSessionOrderByRelationAggregateInput
    executions?: TestExecutionOrderByRelationAggregateInput
    coverage?: TestCoverageOrderByRelationAggregateInput
    fixes?: TestFixOrderByRelationAggregateInput
    generations?: TestGenerationOrderByRelationAggregateInput
    analyses?: TestAnalysisOrderByRelationAggregateInput
  }

  export type TestFileWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    filePath?: string
    AND?: TestFileWhereInput | TestFileWhereInput[]
    OR?: TestFileWhereInput[]
    NOT?: TestFileWhereInput | TestFileWhereInput[]
    fileName?: StringFilter<"TestFile"> | string
    firstSeen?: DateTimeFilter<"TestFile"> | Date | string
    lastUpdated?: DateTimeFilter<"TestFile"> | Date | string
    totalRuns?: IntFilter<"TestFile"> | number
    avgPassRate?: FloatFilter<"TestFile"> | number
    currentPassRate?: FloatFilter<"TestFile"> | number
    avgDuration?: FloatFilter<"TestFile"> | number
    currentCoverage?: FloatFilter<"TestFile"> | number
    avgCoverage?: FloatFilter<"TestFile"> | number
    totalFixes?: IntFilter<"TestFile"> | number
    flakyTests?: IntFilter<"TestFile"> | number
    metadata?: JsonNullableFilter<"TestFile">
    healthScore?: EnumTestHealthScoreFilter<"TestFile"> | $Enums.TestHealthScore
    totalTests?: IntFilter<"TestFile"> | number
    criticalTests?: IntFilter<"TestFile"> | number
    lastFailureReason?: StringNullableFilter<"TestFile"> | string | null
    sessions?: AnalysisSessionListRelationFilter
    executions?: TestExecutionListRelationFilter
    coverage?: TestCoverageListRelationFilter
    fixes?: TestFixListRelationFilter
    generations?: TestGenerationListRelationFilter
    analyses?: TestAnalysisListRelationFilter
  }, "id" | "filePath">

  export type TestFileOrderByWithAggregationInput = {
    id?: SortOrder
    filePath?: SortOrder
    fileName?: SortOrder
    firstSeen?: SortOrder
    lastUpdated?: SortOrder
    totalRuns?: SortOrder
    avgPassRate?: SortOrder
    currentPassRate?: SortOrder
    avgDuration?: SortOrder
    currentCoverage?: SortOrder
    avgCoverage?: SortOrder
    totalFixes?: SortOrder
    flakyTests?: SortOrder
    metadata?: SortOrderInput | SortOrder
    healthScore?: SortOrder
    totalTests?: SortOrder
    criticalTests?: SortOrder
    lastFailureReason?: SortOrderInput | SortOrder
    _count?: TestFileCountOrderByAggregateInput
    _avg?: TestFileAvgOrderByAggregateInput
    _max?: TestFileMaxOrderByAggregateInput
    _min?: TestFileMinOrderByAggregateInput
    _sum?: TestFileSumOrderByAggregateInput
  }

  export type TestFileScalarWhereWithAggregatesInput = {
    AND?: TestFileScalarWhereWithAggregatesInput | TestFileScalarWhereWithAggregatesInput[]
    OR?: TestFileScalarWhereWithAggregatesInput[]
    NOT?: TestFileScalarWhereWithAggregatesInput | TestFileScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TestFile"> | string
    filePath?: StringWithAggregatesFilter<"TestFile"> | string
    fileName?: StringWithAggregatesFilter<"TestFile"> | string
    firstSeen?: DateTimeWithAggregatesFilter<"TestFile"> | Date | string
    lastUpdated?: DateTimeWithAggregatesFilter<"TestFile"> | Date | string
    totalRuns?: IntWithAggregatesFilter<"TestFile"> | number
    avgPassRate?: FloatWithAggregatesFilter<"TestFile"> | number
    currentPassRate?: FloatWithAggregatesFilter<"TestFile"> | number
    avgDuration?: FloatWithAggregatesFilter<"TestFile"> | number
    currentCoverage?: FloatWithAggregatesFilter<"TestFile"> | number
    avgCoverage?: FloatWithAggregatesFilter<"TestFile"> | number
    totalFixes?: IntWithAggregatesFilter<"TestFile"> | number
    flakyTests?: IntWithAggregatesFilter<"TestFile"> | number
    metadata?: JsonNullableWithAggregatesFilter<"TestFile">
    healthScore?: EnumTestHealthScoreWithAggregatesFilter<"TestFile"> | $Enums.TestHealthScore
    totalTests?: IntWithAggregatesFilter<"TestFile"> | number
    criticalTests?: IntWithAggregatesFilter<"TestFile"> | number
    lastFailureReason?: StringNullableWithAggregatesFilter<"TestFile"> | string | null
  }

  export type TestAnalysisWhereInput = {
    AND?: TestAnalysisWhereInput | TestAnalysisWhereInput[]
    OR?: TestAnalysisWhereInput[]
    NOT?: TestAnalysisWhereInput | TestAnalysisWhereInput[]
    id?: StringFilter<"TestAnalysis"> | string
    sessionId?: StringFilter<"TestAnalysis"> | string
    testFileId?: StringFilter<"TestAnalysis"> | string
    patterns?: JsonFilter<"TestAnalysis">
    antiPatterns?: JsonFilter<"TestAnalysis">
    suggestions?: JsonFilter<"TestAnalysis">
    context?: JsonFilter<"TestAnalysis">
    timestamp?: DateTimeFilter<"TestAnalysis"> | Date | string
    session?: XOR<AnalysisSessionScalarRelationFilter, AnalysisSessionWhereInput>
    testFile?: XOR<TestFileScalarRelationFilter, TestFileWhereInput>
  }

  export type TestAnalysisOrderByWithRelationInput = {
    id?: SortOrder
    sessionId?: SortOrder
    testFileId?: SortOrder
    patterns?: SortOrder
    antiPatterns?: SortOrder
    suggestions?: SortOrder
    context?: SortOrder
    timestamp?: SortOrder
    session?: AnalysisSessionOrderByWithRelationInput
    testFile?: TestFileOrderByWithRelationInput
  }

  export type TestAnalysisWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TestAnalysisWhereInput | TestAnalysisWhereInput[]
    OR?: TestAnalysisWhereInput[]
    NOT?: TestAnalysisWhereInput | TestAnalysisWhereInput[]
    sessionId?: StringFilter<"TestAnalysis"> | string
    testFileId?: StringFilter<"TestAnalysis"> | string
    patterns?: JsonFilter<"TestAnalysis">
    antiPatterns?: JsonFilter<"TestAnalysis">
    suggestions?: JsonFilter<"TestAnalysis">
    context?: JsonFilter<"TestAnalysis">
    timestamp?: DateTimeFilter<"TestAnalysis"> | Date | string
    session?: XOR<AnalysisSessionScalarRelationFilter, AnalysisSessionWhereInput>
    testFile?: XOR<TestFileScalarRelationFilter, TestFileWhereInput>
  }, "id">

  export type TestAnalysisOrderByWithAggregationInput = {
    id?: SortOrder
    sessionId?: SortOrder
    testFileId?: SortOrder
    patterns?: SortOrder
    antiPatterns?: SortOrder
    suggestions?: SortOrder
    context?: SortOrder
    timestamp?: SortOrder
    _count?: TestAnalysisCountOrderByAggregateInput
    _max?: TestAnalysisMaxOrderByAggregateInput
    _min?: TestAnalysisMinOrderByAggregateInput
  }

  export type TestAnalysisScalarWhereWithAggregatesInput = {
    AND?: TestAnalysisScalarWhereWithAggregatesInput | TestAnalysisScalarWhereWithAggregatesInput[]
    OR?: TestAnalysisScalarWhereWithAggregatesInput[]
    NOT?: TestAnalysisScalarWhereWithAggregatesInput | TestAnalysisScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TestAnalysis"> | string
    sessionId?: StringWithAggregatesFilter<"TestAnalysis"> | string
    testFileId?: StringWithAggregatesFilter<"TestAnalysis"> | string
    patterns?: JsonWithAggregatesFilter<"TestAnalysis">
    antiPatterns?: JsonWithAggregatesFilter<"TestAnalysis">
    suggestions?: JsonWithAggregatesFilter<"TestAnalysis">
    context?: JsonWithAggregatesFilter<"TestAnalysis">
    timestamp?: DateTimeWithAggregatesFilter<"TestAnalysis"> | Date | string
  }

  export type TestPatternWhereInput = {
    AND?: TestPatternWhereInput | TestPatternWhereInput[]
    OR?: TestPatternWhereInput[]
    NOT?: TestPatternWhereInput | TestPatternWhereInput[]
    id?: StringFilter<"TestPattern"> | string
    type?: EnumPatternTypeFilter<"TestPattern"> | $Enums.PatternType
    pattern?: StringFilter<"TestPattern"> | string
    context?: JsonFilter<"TestPattern">
    successRate?: FloatFilter<"TestPattern"> | number
    usageCount?: IntFilter<"TestPattern"> | number
    lastUsed?: DateTimeFilter<"TestPattern"> | Date | string
    createdAt?: DateTimeFilter<"TestPattern"> | Date | string
  }

  export type TestPatternOrderByWithRelationInput = {
    id?: SortOrder
    type?: SortOrder
    pattern?: SortOrder
    context?: SortOrder
    successRate?: SortOrder
    usageCount?: SortOrder
    lastUsed?: SortOrder
    createdAt?: SortOrder
  }

  export type TestPatternWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TestPatternWhereInput | TestPatternWhereInput[]
    OR?: TestPatternWhereInput[]
    NOT?: TestPatternWhereInput | TestPatternWhereInput[]
    type?: EnumPatternTypeFilter<"TestPattern"> | $Enums.PatternType
    pattern?: StringFilter<"TestPattern"> | string
    context?: JsonFilter<"TestPattern">
    successRate?: FloatFilter<"TestPattern"> | number
    usageCount?: IntFilter<"TestPattern"> | number
    lastUsed?: DateTimeFilter<"TestPattern"> | Date | string
    createdAt?: DateTimeFilter<"TestPattern"> | Date | string
  }, "id">

  export type TestPatternOrderByWithAggregationInput = {
    id?: SortOrder
    type?: SortOrder
    pattern?: SortOrder
    context?: SortOrder
    successRate?: SortOrder
    usageCount?: SortOrder
    lastUsed?: SortOrder
    createdAt?: SortOrder
    _count?: TestPatternCountOrderByAggregateInput
    _avg?: TestPatternAvgOrderByAggregateInput
    _max?: TestPatternMaxOrderByAggregateInput
    _min?: TestPatternMinOrderByAggregateInput
    _sum?: TestPatternSumOrderByAggregateInput
  }

  export type TestPatternScalarWhereWithAggregatesInput = {
    AND?: TestPatternScalarWhereWithAggregatesInput | TestPatternScalarWhereWithAggregatesInput[]
    OR?: TestPatternScalarWhereWithAggregatesInput[]
    NOT?: TestPatternScalarWhereWithAggregatesInput | TestPatternScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TestPattern"> | string
    type?: EnumPatternTypeWithAggregatesFilter<"TestPattern"> | $Enums.PatternType
    pattern?: StringWithAggregatesFilter<"TestPattern"> | string
    context?: JsonWithAggregatesFilter<"TestPattern">
    successRate?: FloatWithAggregatesFilter<"TestPattern"> | number
    usageCount?: IntWithAggregatesFilter<"TestPattern"> | number
    lastUsed?: DateTimeWithAggregatesFilter<"TestPattern"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"TestPattern"> | Date | string
  }

  export type FixPatternWhereInput = {
    AND?: FixPatternWhereInput | FixPatternWhereInput[]
    OR?: FixPatternWhereInput[]
    NOT?: FixPatternWhereInput | FixPatternWhereInput[]
    id?: StringFilter<"FixPattern"> | string
    problem?: StringFilter<"FixPattern"> | string
    solution?: StringFilter<"FixPattern"> | string
    context?: JsonFilter<"FixPattern">
    successRate?: FloatFilter<"FixPattern"> | number
    usageCount?: IntFilter<"FixPattern"> | number
    lastUsed?: DateTimeFilter<"FixPattern"> | Date | string
    createdAt?: DateTimeFilter<"FixPattern"> | Date | string
  }

  export type FixPatternOrderByWithRelationInput = {
    id?: SortOrder
    problem?: SortOrder
    solution?: SortOrder
    context?: SortOrder
    successRate?: SortOrder
    usageCount?: SortOrder
    lastUsed?: SortOrder
    createdAt?: SortOrder
  }

  export type FixPatternWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: FixPatternWhereInput | FixPatternWhereInput[]
    OR?: FixPatternWhereInput[]
    NOT?: FixPatternWhereInput | FixPatternWhereInput[]
    problem?: StringFilter<"FixPattern"> | string
    solution?: StringFilter<"FixPattern"> | string
    context?: JsonFilter<"FixPattern">
    successRate?: FloatFilter<"FixPattern"> | number
    usageCount?: IntFilter<"FixPattern"> | number
    lastUsed?: DateTimeFilter<"FixPattern"> | Date | string
    createdAt?: DateTimeFilter<"FixPattern"> | Date | string
  }, "id">

  export type FixPatternOrderByWithAggregationInput = {
    id?: SortOrder
    problem?: SortOrder
    solution?: SortOrder
    context?: SortOrder
    successRate?: SortOrder
    usageCount?: SortOrder
    lastUsed?: SortOrder
    createdAt?: SortOrder
    _count?: FixPatternCountOrderByAggregateInput
    _avg?: FixPatternAvgOrderByAggregateInput
    _max?: FixPatternMaxOrderByAggregateInput
    _min?: FixPatternMinOrderByAggregateInput
    _sum?: FixPatternSumOrderByAggregateInput
  }

  export type FixPatternScalarWhereWithAggregatesInput = {
    AND?: FixPatternScalarWhereWithAggregatesInput | FixPatternScalarWhereWithAggregatesInput[]
    OR?: FixPatternScalarWhereWithAggregatesInput[]
    NOT?: FixPatternScalarWhereWithAggregatesInput | FixPatternScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"FixPattern"> | string
    problem?: StringWithAggregatesFilter<"FixPattern"> | string
    solution?: StringWithAggregatesFilter<"FixPattern"> | string
    context?: JsonWithAggregatesFilter<"FixPattern">
    successRate?: FloatWithAggregatesFilter<"FixPattern"> | number
    usageCount?: IntWithAggregatesFilter<"FixPattern"> | number
    lastUsed?: DateTimeWithAggregatesFilter<"FixPattern"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"FixPattern"> | Date | string
  }

  export type TestExecutionWhereInput = {
    AND?: TestExecutionWhereInput | TestExecutionWhereInput[]
    OR?: TestExecutionWhereInput[]
    NOT?: TestExecutionWhereInput | TestExecutionWhereInput[]
    id?: StringFilter<"TestExecution"> | string
    testFileId?: StringFilter<"TestExecution"> | string
    executedAt?: DateTimeFilter<"TestExecution"> | Date | string
    passed?: BoolFilter<"TestExecution"> | boolean
    duration?: FloatFilter<"TestExecution"> | number
    errorMessage?: StringNullableFilter<"TestExecution"> | string | null
    testResults?: JsonFilter<"TestExecution">
    environment?: StringFilter<"TestExecution"> | string
    commitHash?: StringNullableFilter<"TestExecution"> | string | null
    performance?: JsonNullableFilter<"TestExecution">
    testFile?: XOR<TestFileScalarRelationFilter, TestFileWhereInput>
  }

  export type TestExecutionOrderByWithRelationInput = {
    id?: SortOrder
    testFileId?: SortOrder
    executedAt?: SortOrder
    passed?: SortOrder
    duration?: SortOrder
    errorMessage?: SortOrderInput | SortOrder
    testResults?: SortOrder
    environment?: SortOrder
    commitHash?: SortOrderInput | SortOrder
    performance?: SortOrderInput | SortOrder
    testFile?: TestFileOrderByWithRelationInput
  }

  export type TestExecutionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TestExecutionWhereInput | TestExecutionWhereInput[]
    OR?: TestExecutionWhereInput[]
    NOT?: TestExecutionWhereInput | TestExecutionWhereInput[]
    testFileId?: StringFilter<"TestExecution"> | string
    executedAt?: DateTimeFilter<"TestExecution"> | Date | string
    passed?: BoolFilter<"TestExecution"> | boolean
    duration?: FloatFilter<"TestExecution"> | number
    errorMessage?: StringNullableFilter<"TestExecution"> | string | null
    testResults?: JsonFilter<"TestExecution">
    environment?: StringFilter<"TestExecution"> | string
    commitHash?: StringNullableFilter<"TestExecution"> | string | null
    performance?: JsonNullableFilter<"TestExecution">
    testFile?: XOR<TestFileScalarRelationFilter, TestFileWhereInput>
  }, "id">

  export type TestExecutionOrderByWithAggregationInput = {
    id?: SortOrder
    testFileId?: SortOrder
    executedAt?: SortOrder
    passed?: SortOrder
    duration?: SortOrder
    errorMessage?: SortOrderInput | SortOrder
    testResults?: SortOrder
    environment?: SortOrder
    commitHash?: SortOrderInput | SortOrder
    performance?: SortOrderInput | SortOrder
    _count?: TestExecutionCountOrderByAggregateInput
    _avg?: TestExecutionAvgOrderByAggregateInput
    _max?: TestExecutionMaxOrderByAggregateInput
    _min?: TestExecutionMinOrderByAggregateInput
    _sum?: TestExecutionSumOrderByAggregateInput
  }

  export type TestExecutionScalarWhereWithAggregatesInput = {
    AND?: TestExecutionScalarWhereWithAggregatesInput | TestExecutionScalarWhereWithAggregatesInput[]
    OR?: TestExecutionScalarWhereWithAggregatesInput[]
    NOT?: TestExecutionScalarWhereWithAggregatesInput | TestExecutionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TestExecution"> | string
    testFileId?: StringWithAggregatesFilter<"TestExecution"> | string
    executedAt?: DateTimeWithAggregatesFilter<"TestExecution"> | Date | string
    passed?: BoolWithAggregatesFilter<"TestExecution"> | boolean
    duration?: FloatWithAggregatesFilter<"TestExecution"> | number
    errorMessage?: StringNullableWithAggregatesFilter<"TestExecution"> | string | null
    testResults?: JsonWithAggregatesFilter<"TestExecution">
    environment?: StringWithAggregatesFilter<"TestExecution"> | string
    commitHash?: StringNullableWithAggregatesFilter<"TestExecution"> | string | null
    performance?: JsonNullableWithAggregatesFilter<"TestExecution">
  }

  export type TestCoverageWhereInput = {
    AND?: TestCoverageWhereInput | TestCoverageWhereInput[]
    OR?: TestCoverageWhereInput[]
    NOT?: TestCoverageWhereInput | TestCoverageWhereInput[]
    id?: StringFilter<"TestCoverage"> | string
    testFileId?: StringFilter<"TestCoverage"> | string
    measuredAt?: DateTimeFilter<"TestCoverage"> | Date | string
    coveragePercent?: FloatFilter<"TestCoverage"> | number
    linesCovered?: JsonFilter<"TestCoverage">
    linesUncovered?: JsonFilter<"TestCoverage">
    branchCoverage?: JsonNullableFilter<"TestCoverage">
    functionCoverage?: JsonNullableFilter<"TestCoverage">
    suggestedAreas?: JsonNullableFilter<"TestCoverage">
    coverageType?: StringFilter<"TestCoverage"> | string
    testFile?: XOR<TestFileScalarRelationFilter, TestFileWhereInput>
  }

  export type TestCoverageOrderByWithRelationInput = {
    id?: SortOrder
    testFileId?: SortOrder
    measuredAt?: SortOrder
    coveragePercent?: SortOrder
    linesCovered?: SortOrder
    linesUncovered?: SortOrder
    branchCoverage?: SortOrderInput | SortOrder
    functionCoverage?: SortOrderInput | SortOrder
    suggestedAreas?: SortOrderInput | SortOrder
    coverageType?: SortOrder
    testFile?: TestFileOrderByWithRelationInput
  }

  export type TestCoverageWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TestCoverageWhereInput | TestCoverageWhereInput[]
    OR?: TestCoverageWhereInput[]
    NOT?: TestCoverageWhereInput | TestCoverageWhereInput[]
    testFileId?: StringFilter<"TestCoverage"> | string
    measuredAt?: DateTimeFilter<"TestCoverage"> | Date | string
    coveragePercent?: FloatFilter<"TestCoverage"> | number
    linesCovered?: JsonFilter<"TestCoverage">
    linesUncovered?: JsonFilter<"TestCoverage">
    branchCoverage?: JsonNullableFilter<"TestCoverage">
    functionCoverage?: JsonNullableFilter<"TestCoverage">
    suggestedAreas?: JsonNullableFilter<"TestCoverage">
    coverageType?: StringFilter<"TestCoverage"> | string
    testFile?: XOR<TestFileScalarRelationFilter, TestFileWhereInput>
  }, "id">

  export type TestCoverageOrderByWithAggregationInput = {
    id?: SortOrder
    testFileId?: SortOrder
    measuredAt?: SortOrder
    coveragePercent?: SortOrder
    linesCovered?: SortOrder
    linesUncovered?: SortOrder
    branchCoverage?: SortOrderInput | SortOrder
    functionCoverage?: SortOrderInput | SortOrder
    suggestedAreas?: SortOrderInput | SortOrder
    coverageType?: SortOrder
    _count?: TestCoverageCountOrderByAggregateInput
    _avg?: TestCoverageAvgOrderByAggregateInput
    _max?: TestCoverageMaxOrderByAggregateInput
    _min?: TestCoverageMinOrderByAggregateInput
    _sum?: TestCoverageSumOrderByAggregateInput
  }

  export type TestCoverageScalarWhereWithAggregatesInput = {
    AND?: TestCoverageScalarWhereWithAggregatesInput | TestCoverageScalarWhereWithAggregatesInput[]
    OR?: TestCoverageScalarWhereWithAggregatesInput[]
    NOT?: TestCoverageScalarWhereWithAggregatesInput | TestCoverageScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TestCoverage"> | string
    testFileId?: StringWithAggregatesFilter<"TestCoverage"> | string
    measuredAt?: DateTimeWithAggregatesFilter<"TestCoverage"> | Date | string
    coveragePercent?: FloatWithAggregatesFilter<"TestCoverage"> | number
    linesCovered?: JsonWithAggregatesFilter<"TestCoverage">
    linesUncovered?: JsonWithAggregatesFilter<"TestCoverage">
    branchCoverage?: JsonNullableWithAggregatesFilter<"TestCoverage">
    functionCoverage?: JsonNullableWithAggregatesFilter<"TestCoverage">
    suggestedAreas?: JsonNullableWithAggregatesFilter<"TestCoverage">
    coverageType?: StringWithAggregatesFilter<"TestCoverage"> | string
  }

  export type TestFixWhereInput = {
    AND?: TestFixWhereInput | TestFixWhereInput[]
    OR?: TestFixWhereInput[]
    NOT?: TestFixWhereInput | TestFixWhereInput[]
    id?: StringFilter<"TestFix"> | string
    testFileId?: StringFilter<"TestFix"> | string
    appliedAt?: DateTimeFilter<"TestFix"> | Date | string
    fixType?: EnumFixTypeFilter<"TestFix"> | $Enums.FixType
    problem?: StringFilter<"TestFix"> | string
    solution?: StringFilter<"TestFix"> | string
    successful?: BoolFilter<"TestFix"> | boolean
    confidenceScore?: FloatFilter<"TestFix"> | number
    beforeState?: JsonFilter<"TestFix">
    afterState?: JsonFilter<"TestFix">
    patternUsed?: StringNullableFilter<"TestFix"> | string | null
    impactScore?: FloatFilter<"TestFix"> | number
    testFile?: XOR<TestFileScalarRelationFilter, TestFileWhereInput>
  }

  export type TestFixOrderByWithRelationInput = {
    id?: SortOrder
    testFileId?: SortOrder
    appliedAt?: SortOrder
    fixType?: SortOrder
    problem?: SortOrder
    solution?: SortOrder
    successful?: SortOrder
    confidenceScore?: SortOrder
    beforeState?: SortOrder
    afterState?: SortOrder
    patternUsed?: SortOrderInput | SortOrder
    impactScore?: SortOrder
    testFile?: TestFileOrderByWithRelationInput
  }

  export type TestFixWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TestFixWhereInput | TestFixWhereInput[]
    OR?: TestFixWhereInput[]
    NOT?: TestFixWhereInput | TestFixWhereInput[]
    testFileId?: StringFilter<"TestFix"> | string
    appliedAt?: DateTimeFilter<"TestFix"> | Date | string
    fixType?: EnumFixTypeFilter<"TestFix"> | $Enums.FixType
    problem?: StringFilter<"TestFix"> | string
    solution?: StringFilter<"TestFix"> | string
    successful?: BoolFilter<"TestFix"> | boolean
    confidenceScore?: FloatFilter<"TestFix"> | number
    beforeState?: JsonFilter<"TestFix">
    afterState?: JsonFilter<"TestFix">
    patternUsed?: StringNullableFilter<"TestFix"> | string | null
    impactScore?: FloatFilter<"TestFix"> | number
    testFile?: XOR<TestFileScalarRelationFilter, TestFileWhereInput>
  }, "id">

  export type TestFixOrderByWithAggregationInput = {
    id?: SortOrder
    testFileId?: SortOrder
    appliedAt?: SortOrder
    fixType?: SortOrder
    problem?: SortOrder
    solution?: SortOrder
    successful?: SortOrder
    confidenceScore?: SortOrder
    beforeState?: SortOrder
    afterState?: SortOrder
    patternUsed?: SortOrderInput | SortOrder
    impactScore?: SortOrder
    _count?: TestFixCountOrderByAggregateInput
    _avg?: TestFixAvgOrderByAggregateInput
    _max?: TestFixMaxOrderByAggregateInput
    _min?: TestFixMinOrderByAggregateInput
    _sum?: TestFixSumOrderByAggregateInput
  }

  export type TestFixScalarWhereWithAggregatesInput = {
    AND?: TestFixScalarWhereWithAggregatesInput | TestFixScalarWhereWithAggregatesInput[]
    OR?: TestFixScalarWhereWithAggregatesInput[]
    NOT?: TestFixScalarWhereWithAggregatesInput | TestFixScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TestFix"> | string
    testFileId?: StringWithAggregatesFilter<"TestFix"> | string
    appliedAt?: DateTimeWithAggregatesFilter<"TestFix"> | Date | string
    fixType?: EnumFixTypeWithAggregatesFilter<"TestFix"> | $Enums.FixType
    problem?: StringWithAggregatesFilter<"TestFix"> | string
    solution?: StringWithAggregatesFilter<"TestFix"> | string
    successful?: BoolWithAggregatesFilter<"TestFix"> | boolean
    confidenceScore?: FloatWithAggregatesFilter<"TestFix"> | number
    beforeState?: JsonWithAggregatesFilter<"TestFix">
    afterState?: JsonWithAggregatesFilter<"TestFix">
    patternUsed?: StringNullableWithAggregatesFilter<"TestFix"> | string | null
    impactScore?: FloatWithAggregatesFilter<"TestFix"> | number
  }

  export type TestGenerationWhereInput = {
    AND?: TestGenerationWhereInput | TestGenerationWhereInput[]
    OR?: TestGenerationWhereInput[]
    NOT?: TestGenerationWhereInput | TestGenerationWhereInput[]
    id?: StringFilter<"TestGeneration"> | string
    testFileId?: StringFilter<"TestGeneration"> | string
    generatedAt?: DateTimeFilter<"TestGeneration"> | Date | string
    generationType?: EnumGenerationTypeFilter<"TestGeneration"> | $Enums.GenerationType
    newTests?: JsonFilter<"TestGeneration">
    accepted?: BoolFilter<"TestGeneration"> | boolean
    targetArea?: StringFilter<"TestGeneration"> | string
    coverageImprovement?: FloatFilter<"TestGeneration"> | number
    generationStrategy?: StringFilter<"TestGeneration"> | string
    context?: JsonFilter<"TestGeneration">
    testFile?: XOR<TestFileScalarRelationFilter, TestFileWhereInput>
  }

  export type TestGenerationOrderByWithRelationInput = {
    id?: SortOrder
    testFileId?: SortOrder
    generatedAt?: SortOrder
    generationType?: SortOrder
    newTests?: SortOrder
    accepted?: SortOrder
    targetArea?: SortOrder
    coverageImprovement?: SortOrder
    generationStrategy?: SortOrder
    context?: SortOrder
    testFile?: TestFileOrderByWithRelationInput
  }

  export type TestGenerationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TestGenerationWhereInput | TestGenerationWhereInput[]
    OR?: TestGenerationWhereInput[]
    NOT?: TestGenerationWhereInput | TestGenerationWhereInput[]
    testFileId?: StringFilter<"TestGeneration"> | string
    generatedAt?: DateTimeFilter<"TestGeneration"> | Date | string
    generationType?: EnumGenerationTypeFilter<"TestGeneration"> | $Enums.GenerationType
    newTests?: JsonFilter<"TestGeneration">
    accepted?: BoolFilter<"TestGeneration"> | boolean
    targetArea?: StringFilter<"TestGeneration"> | string
    coverageImprovement?: FloatFilter<"TestGeneration"> | number
    generationStrategy?: StringFilter<"TestGeneration"> | string
    context?: JsonFilter<"TestGeneration">
    testFile?: XOR<TestFileScalarRelationFilter, TestFileWhereInput>
  }, "id">

  export type TestGenerationOrderByWithAggregationInput = {
    id?: SortOrder
    testFileId?: SortOrder
    generatedAt?: SortOrder
    generationType?: SortOrder
    newTests?: SortOrder
    accepted?: SortOrder
    targetArea?: SortOrder
    coverageImprovement?: SortOrder
    generationStrategy?: SortOrder
    context?: SortOrder
    _count?: TestGenerationCountOrderByAggregateInput
    _avg?: TestGenerationAvgOrderByAggregateInput
    _max?: TestGenerationMaxOrderByAggregateInput
    _min?: TestGenerationMinOrderByAggregateInput
    _sum?: TestGenerationSumOrderByAggregateInput
  }

  export type TestGenerationScalarWhereWithAggregatesInput = {
    AND?: TestGenerationScalarWhereWithAggregatesInput | TestGenerationScalarWhereWithAggregatesInput[]
    OR?: TestGenerationScalarWhereWithAggregatesInput[]
    NOT?: TestGenerationScalarWhereWithAggregatesInput | TestGenerationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TestGeneration"> | string
    testFileId?: StringWithAggregatesFilter<"TestGeneration"> | string
    generatedAt?: DateTimeWithAggregatesFilter<"TestGeneration"> | Date | string
    generationType?: EnumGenerationTypeWithAggregatesFilter<"TestGeneration"> | $Enums.GenerationType
    newTests?: JsonWithAggregatesFilter<"TestGeneration">
    accepted?: BoolWithAggregatesFilter<"TestGeneration"> | boolean
    targetArea?: StringWithAggregatesFilter<"TestGeneration"> | string
    coverageImprovement?: FloatWithAggregatesFilter<"TestGeneration"> | number
    generationStrategy?: StringWithAggregatesFilter<"TestGeneration"> | string
    context?: JsonWithAggregatesFilter<"TestGeneration">
  }

  export type AnalysisSessionCreateInput = {
    id?: string
    startedAt?: Date | string
    endedAt?: Date | string | null
    status?: $Enums.SessionStatus
    context?: NullableJsonNullValueInput | InputJsonValue
    decisions?: AnalysisSessionCreatedecisionsInput | InputJsonValue[]
    operations?: AnalysisSessionCreateoperationsInput | InputJsonValue[]
    testFiles?: TestFileCreateNestedManyWithoutSessionsInput
    analyses?: TestAnalysisCreateNestedManyWithoutSessionInput
  }

  export type AnalysisSessionUncheckedCreateInput = {
    id?: string
    startedAt?: Date | string
    endedAt?: Date | string | null
    status?: $Enums.SessionStatus
    context?: NullableJsonNullValueInput | InputJsonValue
    decisions?: AnalysisSessionCreatedecisionsInput | InputJsonValue[]
    operations?: AnalysisSessionCreateoperationsInput | InputJsonValue[]
    testFiles?: TestFileUncheckedCreateNestedManyWithoutSessionsInput
    analyses?: TestAnalysisUncheckedCreateNestedManyWithoutSessionInput
  }

  export type AnalysisSessionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumSessionStatusFieldUpdateOperationsInput | $Enums.SessionStatus
    context?: NullableJsonNullValueInput | InputJsonValue
    decisions?: AnalysisSessionUpdatedecisionsInput | InputJsonValue[]
    operations?: AnalysisSessionUpdateoperationsInput | InputJsonValue[]
    testFiles?: TestFileUpdateManyWithoutSessionsNestedInput
    analyses?: TestAnalysisUpdateManyWithoutSessionNestedInput
  }

  export type AnalysisSessionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumSessionStatusFieldUpdateOperationsInput | $Enums.SessionStatus
    context?: NullableJsonNullValueInput | InputJsonValue
    decisions?: AnalysisSessionUpdatedecisionsInput | InputJsonValue[]
    operations?: AnalysisSessionUpdateoperationsInput | InputJsonValue[]
    testFiles?: TestFileUncheckedUpdateManyWithoutSessionsNestedInput
    analyses?: TestAnalysisUncheckedUpdateManyWithoutSessionNestedInput
  }

  export type AnalysisSessionCreateManyInput = {
    id?: string
    startedAt?: Date | string
    endedAt?: Date | string | null
    status?: $Enums.SessionStatus
    context?: NullableJsonNullValueInput | InputJsonValue
    decisions?: AnalysisSessionCreatedecisionsInput | InputJsonValue[]
    operations?: AnalysisSessionCreateoperationsInput | InputJsonValue[]
  }

  export type AnalysisSessionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumSessionStatusFieldUpdateOperationsInput | $Enums.SessionStatus
    context?: NullableJsonNullValueInput | InputJsonValue
    decisions?: AnalysisSessionUpdatedecisionsInput | InputJsonValue[]
    operations?: AnalysisSessionUpdateoperationsInput | InputJsonValue[]
  }

  export type AnalysisSessionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumSessionStatusFieldUpdateOperationsInput | $Enums.SessionStatus
    context?: NullableJsonNullValueInput | InputJsonValue
    decisions?: AnalysisSessionUpdatedecisionsInput | InputJsonValue[]
    operations?: AnalysisSessionUpdateoperationsInput | InputJsonValue[]
  }

  export type TestFileCreateInput = {
    id?: string
    filePath: string
    fileName: string
    firstSeen?: Date | string
    lastUpdated?: Date | string
    totalRuns?: number
    avgPassRate?: number
    currentPassRate?: number
    avgDuration?: number
    currentCoverage?: number
    avgCoverage?: number
    totalFixes?: number
    flakyTests?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: $Enums.TestHealthScore
    totalTests?: number
    criticalTests?: number
    lastFailureReason?: string | null
    sessions?: AnalysisSessionCreateNestedManyWithoutTestFilesInput
    executions?: TestExecutionCreateNestedManyWithoutTestFileInput
    coverage?: TestCoverageCreateNestedManyWithoutTestFileInput
    fixes?: TestFixCreateNestedManyWithoutTestFileInput
    generations?: TestGenerationCreateNestedManyWithoutTestFileInput
    analyses?: TestAnalysisCreateNestedManyWithoutTestFileInput
  }

  export type TestFileUncheckedCreateInput = {
    id?: string
    filePath: string
    fileName: string
    firstSeen?: Date | string
    lastUpdated?: Date | string
    totalRuns?: number
    avgPassRate?: number
    currentPassRate?: number
    avgDuration?: number
    currentCoverage?: number
    avgCoverage?: number
    totalFixes?: number
    flakyTests?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: $Enums.TestHealthScore
    totalTests?: number
    criticalTests?: number
    lastFailureReason?: string | null
    sessions?: AnalysisSessionUncheckedCreateNestedManyWithoutTestFilesInput
    executions?: TestExecutionUncheckedCreateNestedManyWithoutTestFileInput
    coverage?: TestCoverageUncheckedCreateNestedManyWithoutTestFileInput
    fixes?: TestFixUncheckedCreateNestedManyWithoutTestFileInput
    generations?: TestGenerationUncheckedCreateNestedManyWithoutTestFileInput
    analyses?: TestAnalysisUncheckedCreateNestedManyWithoutTestFileInput
  }

  export type TestFileUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    filePath?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    totalRuns?: IntFieldUpdateOperationsInput | number
    avgPassRate?: FloatFieldUpdateOperationsInput | number
    currentPassRate?: FloatFieldUpdateOperationsInput | number
    avgDuration?: FloatFieldUpdateOperationsInput | number
    currentCoverage?: FloatFieldUpdateOperationsInput | number
    avgCoverage?: FloatFieldUpdateOperationsInput | number
    totalFixes?: IntFieldUpdateOperationsInput | number
    flakyTests?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: EnumTestHealthScoreFieldUpdateOperationsInput | $Enums.TestHealthScore
    totalTests?: IntFieldUpdateOperationsInput | number
    criticalTests?: IntFieldUpdateOperationsInput | number
    lastFailureReason?: NullableStringFieldUpdateOperationsInput | string | null
    sessions?: AnalysisSessionUpdateManyWithoutTestFilesNestedInput
    executions?: TestExecutionUpdateManyWithoutTestFileNestedInput
    coverage?: TestCoverageUpdateManyWithoutTestFileNestedInput
    fixes?: TestFixUpdateManyWithoutTestFileNestedInput
    generations?: TestGenerationUpdateManyWithoutTestFileNestedInput
    analyses?: TestAnalysisUpdateManyWithoutTestFileNestedInput
  }

  export type TestFileUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    filePath?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    totalRuns?: IntFieldUpdateOperationsInput | number
    avgPassRate?: FloatFieldUpdateOperationsInput | number
    currentPassRate?: FloatFieldUpdateOperationsInput | number
    avgDuration?: FloatFieldUpdateOperationsInput | number
    currentCoverage?: FloatFieldUpdateOperationsInput | number
    avgCoverage?: FloatFieldUpdateOperationsInput | number
    totalFixes?: IntFieldUpdateOperationsInput | number
    flakyTests?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: EnumTestHealthScoreFieldUpdateOperationsInput | $Enums.TestHealthScore
    totalTests?: IntFieldUpdateOperationsInput | number
    criticalTests?: IntFieldUpdateOperationsInput | number
    lastFailureReason?: NullableStringFieldUpdateOperationsInput | string | null
    sessions?: AnalysisSessionUncheckedUpdateManyWithoutTestFilesNestedInput
    executions?: TestExecutionUncheckedUpdateManyWithoutTestFileNestedInput
    coverage?: TestCoverageUncheckedUpdateManyWithoutTestFileNestedInput
    fixes?: TestFixUncheckedUpdateManyWithoutTestFileNestedInput
    generations?: TestGenerationUncheckedUpdateManyWithoutTestFileNestedInput
    analyses?: TestAnalysisUncheckedUpdateManyWithoutTestFileNestedInput
  }

  export type TestFileCreateManyInput = {
    id?: string
    filePath: string
    fileName: string
    firstSeen?: Date | string
    lastUpdated?: Date | string
    totalRuns?: number
    avgPassRate?: number
    currentPassRate?: number
    avgDuration?: number
    currentCoverage?: number
    avgCoverage?: number
    totalFixes?: number
    flakyTests?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: $Enums.TestHealthScore
    totalTests?: number
    criticalTests?: number
    lastFailureReason?: string | null
  }

  export type TestFileUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    filePath?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    totalRuns?: IntFieldUpdateOperationsInput | number
    avgPassRate?: FloatFieldUpdateOperationsInput | number
    currentPassRate?: FloatFieldUpdateOperationsInput | number
    avgDuration?: FloatFieldUpdateOperationsInput | number
    currentCoverage?: FloatFieldUpdateOperationsInput | number
    avgCoverage?: FloatFieldUpdateOperationsInput | number
    totalFixes?: IntFieldUpdateOperationsInput | number
    flakyTests?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: EnumTestHealthScoreFieldUpdateOperationsInput | $Enums.TestHealthScore
    totalTests?: IntFieldUpdateOperationsInput | number
    criticalTests?: IntFieldUpdateOperationsInput | number
    lastFailureReason?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type TestFileUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    filePath?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    totalRuns?: IntFieldUpdateOperationsInput | number
    avgPassRate?: FloatFieldUpdateOperationsInput | number
    currentPassRate?: FloatFieldUpdateOperationsInput | number
    avgDuration?: FloatFieldUpdateOperationsInput | number
    currentCoverage?: FloatFieldUpdateOperationsInput | number
    avgCoverage?: FloatFieldUpdateOperationsInput | number
    totalFixes?: IntFieldUpdateOperationsInput | number
    flakyTests?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: EnumTestHealthScoreFieldUpdateOperationsInput | $Enums.TestHealthScore
    totalTests?: IntFieldUpdateOperationsInput | number
    criticalTests?: IntFieldUpdateOperationsInput | number
    lastFailureReason?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type TestAnalysisCreateInput = {
    id?: string
    patterns: JsonNullValueInput | InputJsonValue
    antiPatterns: JsonNullValueInput | InputJsonValue
    suggestions: JsonNullValueInput | InputJsonValue
    context: JsonNullValueInput | InputJsonValue
    timestamp?: Date | string
    session: AnalysisSessionCreateNestedOneWithoutAnalysesInput
    testFile: TestFileCreateNestedOneWithoutAnalysesInput
  }

  export type TestAnalysisUncheckedCreateInput = {
    id?: string
    sessionId: string
    testFileId: string
    patterns: JsonNullValueInput | InputJsonValue
    antiPatterns: JsonNullValueInput | InputJsonValue
    suggestions: JsonNullValueInput | InputJsonValue
    context: JsonNullValueInput | InputJsonValue
    timestamp?: Date | string
  }

  export type TestAnalysisUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    patterns?: JsonNullValueInput | InputJsonValue
    antiPatterns?: JsonNullValueInput | InputJsonValue
    suggestions?: JsonNullValueInput | InputJsonValue
    context?: JsonNullValueInput | InputJsonValue
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    session?: AnalysisSessionUpdateOneRequiredWithoutAnalysesNestedInput
    testFile?: TestFileUpdateOneRequiredWithoutAnalysesNestedInput
  }

  export type TestAnalysisUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionId?: StringFieldUpdateOperationsInput | string
    testFileId?: StringFieldUpdateOperationsInput | string
    patterns?: JsonNullValueInput | InputJsonValue
    antiPatterns?: JsonNullValueInput | InputJsonValue
    suggestions?: JsonNullValueInput | InputJsonValue
    context?: JsonNullValueInput | InputJsonValue
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TestAnalysisCreateManyInput = {
    id?: string
    sessionId: string
    testFileId: string
    patterns: JsonNullValueInput | InputJsonValue
    antiPatterns: JsonNullValueInput | InputJsonValue
    suggestions: JsonNullValueInput | InputJsonValue
    context: JsonNullValueInput | InputJsonValue
    timestamp?: Date | string
  }

  export type TestAnalysisUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    patterns?: JsonNullValueInput | InputJsonValue
    antiPatterns?: JsonNullValueInput | InputJsonValue
    suggestions?: JsonNullValueInput | InputJsonValue
    context?: JsonNullValueInput | InputJsonValue
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TestAnalysisUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionId?: StringFieldUpdateOperationsInput | string
    testFileId?: StringFieldUpdateOperationsInput | string
    patterns?: JsonNullValueInput | InputJsonValue
    antiPatterns?: JsonNullValueInput | InputJsonValue
    suggestions?: JsonNullValueInput | InputJsonValue
    context?: JsonNullValueInput | InputJsonValue
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TestPatternCreateInput = {
    id?: string
    type: $Enums.PatternType
    pattern: string
    context: JsonNullValueInput | InputJsonValue
    successRate?: number
    usageCount?: number
    lastUsed?: Date | string
    createdAt?: Date | string
  }

  export type TestPatternUncheckedCreateInput = {
    id?: string
    type: $Enums.PatternType
    pattern: string
    context: JsonNullValueInput | InputJsonValue
    successRate?: number
    usageCount?: number
    lastUsed?: Date | string
    createdAt?: Date | string
  }

  export type TestPatternUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumPatternTypeFieldUpdateOperationsInput | $Enums.PatternType
    pattern?: StringFieldUpdateOperationsInput | string
    context?: JsonNullValueInput | InputJsonValue
    successRate?: FloatFieldUpdateOperationsInput | number
    usageCount?: IntFieldUpdateOperationsInput | number
    lastUsed?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TestPatternUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumPatternTypeFieldUpdateOperationsInput | $Enums.PatternType
    pattern?: StringFieldUpdateOperationsInput | string
    context?: JsonNullValueInput | InputJsonValue
    successRate?: FloatFieldUpdateOperationsInput | number
    usageCount?: IntFieldUpdateOperationsInput | number
    lastUsed?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TestPatternCreateManyInput = {
    id?: string
    type: $Enums.PatternType
    pattern: string
    context: JsonNullValueInput | InputJsonValue
    successRate?: number
    usageCount?: number
    lastUsed?: Date | string
    createdAt?: Date | string
  }

  export type TestPatternUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumPatternTypeFieldUpdateOperationsInput | $Enums.PatternType
    pattern?: StringFieldUpdateOperationsInput | string
    context?: JsonNullValueInput | InputJsonValue
    successRate?: FloatFieldUpdateOperationsInput | number
    usageCount?: IntFieldUpdateOperationsInput | number
    lastUsed?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TestPatternUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumPatternTypeFieldUpdateOperationsInput | $Enums.PatternType
    pattern?: StringFieldUpdateOperationsInput | string
    context?: JsonNullValueInput | InputJsonValue
    successRate?: FloatFieldUpdateOperationsInput | number
    usageCount?: IntFieldUpdateOperationsInput | number
    lastUsed?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FixPatternCreateInput = {
    id?: string
    problem: string
    solution: string
    context: JsonNullValueInput | InputJsonValue
    successRate?: number
    usageCount?: number
    lastUsed?: Date | string
    createdAt?: Date | string
  }

  export type FixPatternUncheckedCreateInput = {
    id?: string
    problem: string
    solution: string
    context: JsonNullValueInput | InputJsonValue
    successRate?: number
    usageCount?: number
    lastUsed?: Date | string
    createdAt?: Date | string
  }

  export type FixPatternUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    problem?: StringFieldUpdateOperationsInput | string
    solution?: StringFieldUpdateOperationsInput | string
    context?: JsonNullValueInput | InputJsonValue
    successRate?: FloatFieldUpdateOperationsInput | number
    usageCount?: IntFieldUpdateOperationsInput | number
    lastUsed?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FixPatternUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    problem?: StringFieldUpdateOperationsInput | string
    solution?: StringFieldUpdateOperationsInput | string
    context?: JsonNullValueInput | InputJsonValue
    successRate?: FloatFieldUpdateOperationsInput | number
    usageCount?: IntFieldUpdateOperationsInput | number
    lastUsed?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FixPatternCreateManyInput = {
    id?: string
    problem: string
    solution: string
    context: JsonNullValueInput | InputJsonValue
    successRate?: number
    usageCount?: number
    lastUsed?: Date | string
    createdAt?: Date | string
  }

  export type FixPatternUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    problem?: StringFieldUpdateOperationsInput | string
    solution?: StringFieldUpdateOperationsInput | string
    context?: JsonNullValueInput | InputJsonValue
    successRate?: FloatFieldUpdateOperationsInput | number
    usageCount?: IntFieldUpdateOperationsInput | number
    lastUsed?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FixPatternUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    problem?: StringFieldUpdateOperationsInput | string
    solution?: StringFieldUpdateOperationsInput | string
    context?: JsonNullValueInput | InputJsonValue
    successRate?: FloatFieldUpdateOperationsInput | number
    usageCount?: IntFieldUpdateOperationsInput | number
    lastUsed?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TestExecutionCreateInput = {
    id?: string
    executedAt?: Date | string
    passed: boolean
    duration: number
    errorMessage?: string | null
    testResults: JsonNullValueInput | InputJsonValue
    environment: string
    commitHash?: string | null
    performance?: NullableJsonNullValueInput | InputJsonValue
    testFile: TestFileCreateNestedOneWithoutExecutionsInput
  }

  export type TestExecutionUncheckedCreateInput = {
    id?: string
    testFileId: string
    executedAt?: Date | string
    passed: boolean
    duration: number
    errorMessage?: string | null
    testResults: JsonNullValueInput | InputJsonValue
    environment: string
    commitHash?: string | null
    performance?: NullableJsonNullValueInput | InputJsonValue
  }

  export type TestExecutionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    executedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    passed?: BoolFieldUpdateOperationsInput | boolean
    duration?: FloatFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    testResults?: JsonNullValueInput | InputJsonValue
    environment?: StringFieldUpdateOperationsInput | string
    commitHash?: NullableStringFieldUpdateOperationsInput | string | null
    performance?: NullableJsonNullValueInput | InputJsonValue
    testFile?: TestFileUpdateOneRequiredWithoutExecutionsNestedInput
  }

  export type TestExecutionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    testFileId?: StringFieldUpdateOperationsInput | string
    executedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    passed?: BoolFieldUpdateOperationsInput | boolean
    duration?: FloatFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    testResults?: JsonNullValueInput | InputJsonValue
    environment?: StringFieldUpdateOperationsInput | string
    commitHash?: NullableStringFieldUpdateOperationsInput | string | null
    performance?: NullableJsonNullValueInput | InputJsonValue
  }

  export type TestExecutionCreateManyInput = {
    id?: string
    testFileId: string
    executedAt?: Date | string
    passed: boolean
    duration: number
    errorMessage?: string | null
    testResults: JsonNullValueInput | InputJsonValue
    environment: string
    commitHash?: string | null
    performance?: NullableJsonNullValueInput | InputJsonValue
  }

  export type TestExecutionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    executedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    passed?: BoolFieldUpdateOperationsInput | boolean
    duration?: FloatFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    testResults?: JsonNullValueInput | InputJsonValue
    environment?: StringFieldUpdateOperationsInput | string
    commitHash?: NullableStringFieldUpdateOperationsInput | string | null
    performance?: NullableJsonNullValueInput | InputJsonValue
  }

  export type TestExecutionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    testFileId?: StringFieldUpdateOperationsInput | string
    executedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    passed?: BoolFieldUpdateOperationsInput | boolean
    duration?: FloatFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    testResults?: JsonNullValueInput | InputJsonValue
    environment?: StringFieldUpdateOperationsInput | string
    commitHash?: NullableStringFieldUpdateOperationsInput | string | null
    performance?: NullableJsonNullValueInput | InputJsonValue
  }

  export type TestCoverageCreateInput = {
    id?: string
    measuredAt?: Date | string
    coveragePercent: number
    linesCovered: JsonNullValueInput | InputJsonValue
    linesUncovered: JsonNullValueInput | InputJsonValue
    branchCoverage?: NullableJsonNullValueInput | InputJsonValue
    functionCoverage?: NullableJsonNullValueInput | InputJsonValue
    suggestedAreas?: NullableJsonNullValueInput | InputJsonValue
    coverageType: string
    testFile: TestFileCreateNestedOneWithoutCoverageInput
  }

  export type TestCoverageUncheckedCreateInput = {
    id?: string
    testFileId: string
    measuredAt?: Date | string
    coveragePercent: number
    linesCovered: JsonNullValueInput | InputJsonValue
    linesUncovered: JsonNullValueInput | InputJsonValue
    branchCoverage?: NullableJsonNullValueInput | InputJsonValue
    functionCoverage?: NullableJsonNullValueInput | InputJsonValue
    suggestedAreas?: NullableJsonNullValueInput | InputJsonValue
    coverageType: string
  }

  export type TestCoverageUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    measuredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    coveragePercent?: FloatFieldUpdateOperationsInput | number
    linesCovered?: JsonNullValueInput | InputJsonValue
    linesUncovered?: JsonNullValueInput | InputJsonValue
    branchCoverage?: NullableJsonNullValueInput | InputJsonValue
    functionCoverage?: NullableJsonNullValueInput | InputJsonValue
    suggestedAreas?: NullableJsonNullValueInput | InputJsonValue
    coverageType?: StringFieldUpdateOperationsInput | string
    testFile?: TestFileUpdateOneRequiredWithoutCoverageNestedInput
  }

  export type TestCoverageUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    testFileId?: StringFieldUpdateOperationsInput | string
    measuredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    coveragePercent?: FloatFieldUpdateOperationsInput | number
    linesCovered?: JsonNullValueInput | InputJsonValue
    linesUncovered?: JsonNullValueInput | InputJsonValue
    branchCoverage?: NullableJsonNullValueInput | InputJsonValue
    functionCoverage?: NullableJsonNullValueInput | InputJsonValue
    suggestedAreas?: NullableJsonNullValueInput | InputJsonValue
    coverageType?: StringFieldUpdateOperationsInput | string
  }

  export type TestCoverageCreateManyInput = {
    id?: string
    testFileId: string
    measuredAt?: Date | string
    coveragePercent: number
    linesCovered: JsonNullValueInput | InputJsonValue
    linesUncovered: JsonNullValueInput | InputJsonValue
    branchCoverage?: NullableJsonNullValueInput | InputJsonValue
    functionCoverage?: NullableJsonNullValueInput | InputJsonValue
    suggestedAreas?: NullableJsonNullValueInput | InputJsonValue
    coverageType: string
  }

  export type TestCoverageUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    measuredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    coveragePercent?: FloatFieldUpdateOperationsInput | number
    linesCovered?: JsonNullValueInput | InputJsonValue
    linesUncovered?: JsonNullValueInput | InputJsonValue
    branchCoverage?: NullableJsonNullValueInput | InputJsonValue
    functionCoverage?: NullableJsonNullValueInput | InputJsonValue
    suggestedAreas?: NullableJsonNullValueInput | InputJsonValue
    coverageType?: StringFieldUpdateOperationsInput | string
  }

  export type TestCoverageUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    testFileId?: StringFieldUpdateOperationsInput | string
    measuredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    coveragePercent?: FloatFieldUpdateOperationsInput | number
    linesCovered?: JsonNullValueInput | InputJsonValue
    linesUncovered?: JsonNullValueInput | InputJsonValue
    branchCoverage?: NullableJsonNullValueInput | InputJsonValue
    functionCoverage?: NullableJsonNullValueInput | InputJsonValue
    suggestedAreas?: NullableJsonNullValueInput | InputJsonValue
    coverageType?: StringFieldUpdateOperationsInput | string
  }

  export type TestFixCreateInput = {
    id?: string
    appliedAt?: Date | string
    fixType: $Enums.FixType
    problem: string
    solution: string
    successful: boolean
    confidenceScore: number
    beforeState: JsonNullValueInput | InputJsonValue
    afterState: JsonNullValueInput | InputJsonValue
    patternUsed?: string | null
    impactScore: number
    testFile: TestFileCreateNestedOneWithoutFixesInput
  }

  export type TestFixUncheckedCreateInput = {
    id?: string
    testFileId: string
    appliedAt?: Date | string
    fixType: $Enums.FixType
    problem: string
    solution: string
    successful: boolean
    confidenceScore: number
    beforeState: JsonNullValueInput | InputJsonValue
    afterState: JsonNullValueInput | InputJsonValue
    patternUsed?: string | null
    impactScore: number
  }

  export type TestFixUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    appliedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    fixType?: EnumFixTypeFieldUpdateOperationsInput | $Enums.FixType
    problem?: StringFieldUpdateOperationsInput | string
    solution?: StringFieldUpdateOperationsInput | string
    successful?: BoolFieldUpdateOperationsInput | boolean
    confidenceScore?: FloatFieldUpdateOperationsInput | number
    beforeState?: JsonNullValueInput | InputJsonValue
    afterState?: JsonNullValueInput | InputJsonValue
    patternUsed?: NullableStringFieldUpdateOperationsInput | string | null
    impactScore?: FloatFieldUpdateOperationsInput | number
    testFile?: TestFileUpdateOneRequiredWithoutFixesNestedInput
  }

  export type TestFixUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    testFileId?: StringFieldUpdateOperationsInput | string
    appliedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    fixType?: EnumFixTypeFieldUpdateOperationsInput | $Enums.FixType
    problem?: StringFieldUpdateOperationsInput | string
    solution?: StringFieldUpdateOperationsInput | string
    successful?: BoolFieldUpdateOperationsInput | boolean
    confidenceScore?: FloatFieldUpdateOperationsInput | number
    beforeState?: JsonNullValueInput | InputJsonValue
    afterState?: JsonNullValueInput | InputJsonValue
    patternUsed?: NullableStringFieldUpdateOperationsInput | string | null
    impactScore?: FloatFieldUpdateOperationsInput | number
  }

  export type TestFixCreateManyInput = {
    id?: string
    testFileId: string
    appliedAt?: Date | string
    fixType: $Enums.FixType
    problem: string
    solution: string
    successful: boolean
    confidenceScore: number
    beforeState: JsonNullValueInput | InputJsonValue
    afterState: JsonNullValueInput | InputJsonValue
    patternUsed?: string | null
    impactScore: number
  }

  export type TestFixUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    appliedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    fixType?: EnumFixTypeFieldUpdateOperationsInput | $Enums.FixType
    problem?: StringFieldUpdateOperationsInput | string
    solution?: StringFieldUpdateOperationsInput | string
    successful?: BoolFieldUpdateOperationsInput | boolean
    confidenceScore?: FloatFieldUpdateOperationsInput | number
    beforeState?: JsonNullValueInput | InputJsonValue
    afterState?: JsonNullValueInput | InputJsonValue
    patternUsed?: NullableStringFieldUpdateOperationsInput | string | null
    impactScore?: FloatFieldUpdateOperationsInput | number
  }

  export type TestFixUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    testFileId?: StringFieldUpdateOperationsInput | string
    appliedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    fixType?: EnumFixTypeFieldUpdateOperationsInput | $Enums.FixType
    problem?: StringFieldUpdateOperationsInput | string
    solution?: StringFieldUpdateOperationsInput | string
    successful?: BoolFieldUpdateOperationsInput | boolean
    confidenceScore?: FloatFieldUpdateOperationsInput | number
    beforeState?: JsonNullValueInput | InputJsonValue
    afterState?: JsonNullValueInput | InputJsonValue
    patternUsed?: NullableStringFieldUpdateOperationsInput | string | null
    impactScore?: FloatFieldUpdateOperationsInput | number
  }

  export type TestGenerationCreateInput = {
    id?: string
    generatedAt?: Date | string
    generationType: $Enums.GenerationType
    newTests: JsonNullValueInput | InputJsonValue
    accepted: boolean
    targetArea: string
    coverageImprovement: number
    generationStrategy: string
    context: JsonNullValueInput | InputJsonValue
    testFile: TestFileCreateNestedOneWithoutGenerationsInput
  }

  export type TestGenerationUncheckedCreateInput = {
    id?: string
    testFileId: string
    generatedAt?: Date | string
    generationType: $Enums.GenerationType
    newTests: JsonNullValueInput | InputJsonValue
    accepted: boolean
    targetArea: string
    coverageImprovement: number
    generationStrategy: string
    context: JsonNullValueInput | InputJsonValue
  }

  export type TestGenerationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    generationType?: EnumGenerationTypeFieldUpdateOperationsInput | $Enums.GenerationType
    newTests?: JsonNullValueInput | InputJsonValue
    accepted?: BoolFieldUpdateOperationsInput | boolean
    targetArea?: StringFieldUpdateOperationsInput | string
    coverageImprovement?: FloatFieldUpdateOperationsInput | number
    generationStrategy?: StringFieldUpdateOperationsInput | string
    context?: JsonNullValueInput | InputJsonValue
    testFile?: TestFileUpdateOneRequiredWithoutGenerationsNestedInput
  }

  export type TestGenerationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    testFileId?: StringFieldUpdateOperationsInput | string
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    generationType?: EnumGenerationTypeFieldUpdateOperationsInput | $Enums.GenerationType
    newTests?: JsonNullValueInput | InputJsonValue
    accepted?: BoolFieldUpdateOperationsInput | boolean
    targetArea?: StringFieldUpdateOperationsInput | string
    coverageImprovement?: FloatFieldUpdateOperationsInput | number
    generationStrategy?: StringFieldUpdateOperationsInput | string
    context?: JsonNullValueInput | InputJsonValue
  }

  export type TestGenerationCreateManyInput = {
    id?: string
    testFileId: string
    generatedAt?: Date | string
    generationType: $Enums.GenerationType
    newTests: JsonNullValueInput | InputJsonValue
    accepted: boolean
    targetArea: string
    coverageImprovement: number
    generationStrategy: string
    context: JsonNullValueInput | InputJsonValue
  }

  export type TestGenerationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    generationType?: EnumGenerationTypeFieldUpdateOperationsInput | $Enums.GenerationType
    newTests?: JsonNullValueInput | InputJsonValue
    accepted?: BoolFieldUpdateOperationsInput | boolean
    targetArea?: StringFieldUpdateOperationsInput | string
    coverageImprovement?: FloatFieldUpdateOperationsInput | number
    generationStrategy?: StringFieldUpdateOperationsInput | string
    context?: JsonNullValueInput | InputJsonValue
  }

  export type TestGenerationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    testFileId?: StringFieldUpdateOperationsInput | string
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    generationType?: EnumGenerationTypeFieldUpdateOperationsInput | $Enums.GenerationType
    newTests?: JsonNullValueInput | InputJsonValue
    accepted?: BoolFieldUpdateOperationsInput | boolean
    targetArea?: StringFieldUpdateOperationsInput | string
    coverageImprovement?: FloatFieldUpdateOperationsInput | number
    generationStrategy?: StringFieldUpdateOperationsInput | string
    context?: JsonNullValueInput | InputJsonValue
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type EnumSessionStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SessionStatus | EnumSessionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SessionStatus[] | ListEnumSessionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SessionStatus[] | ListEnumSessionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSessionStatusFilter<$PrismaModel> | $Enums.SessionStatus
  }
  export type JsonNullableFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }
  export type JsonNullableListFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonNullableListFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableListFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableListFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableListFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableListFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue[] | ListJsonFieldRefInput<$PrismaModel> | null
    has?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    hasEvery?: InputJsonValue[] | ListJsonFieldRefInput<$PrismaModel>
    hasSome?: InputJsonValue[] | ListJsonFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type TestFileListRelationFilter = {
    every?: TestFileWhereInput
    some?: TestFileWhereInput
    none?: TestFileWhereInput
  }

  export type TestAnalysisListRelationFilter = {
    every?: TestAnalysisWhereInput
    some?: TestAnalysisWhereInput
    none?: TestAnalysisWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type TestFileOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TestAnalysisOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type AnalysisSessionCountOrderByAggregateInput = {
    id?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrder
    status?: SortOrder
    context?: SortOrder
    decisions?: SortOrder
    operations?: SortOrder
  }

  export type AnalysisSessionMaxOrderByAggregateInput = {
    id?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrder
    status?: SortOrder
  }

  export type AnalysisSessionMinOrderByAggregateInput = {
    id?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrder
    status?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type EnumSessionStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SessionStatus | EnumSessionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SessionStatus[] | ListEnumSessionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SessionStatus[] | ListEnumSessionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSessionStatusWithAggregatesFilter<$PrismaModel> | $Enums.SessionStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSessionStatusFilter<$PrismaModel>
    _max?: NestedEnumSessionStatusFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type EnumTestHealthScoreFilter<$PrismaModel = never> = {
    equals?: $Enums.TestHealthScore | EnumTestHealthScoreFieldRefInput<$PrismaModel>
    in?: $Enums.TestHealthScore[] | ListEnumTestHealthScoreFieldRefInput<$PrismaModel>
    notIn?: $Enums.TestHealthScore[] | ListEnumTestHealthScoreFieldRefInput<$PrismaModel>
    not?: NestedEnumTestHealthScoreFilter<$PrismaModel> | $Enums.TestHealthScore
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type AnalysisSessionListRelationFilter = {
    every?: AnalysisSessionWhereInput
    some?: AnalysisSessionWhereInput
    none?: AnalysisSessionWhereInput
  }

  export type TestExecutionListRelationFilter = {
    every?: TestExecutionWhereInput
    some?: TestExecutionWhereInput
    none?: TestExecutionWhereInput
  }

  export type TestCoverageListRelationFilter = {
    every?: TestCoverageWhereInput
    some?: TestCoverageWhereInput
    none?: TestCoverageWhereInput
  }

  export type TestFixListRelationFilter = {
    every?: TestFixWhereInput
    some?: TestFixWhereInput
    none?: TestFixWhereInput
  }

  export type TestGenerationListRelationFilter = {
    every?: TestGenerationWhereInput
    some?: TestGenerationWhereInput
    none?: TestGenerationWhereInput
  }

  export type AnalysisSessionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TestExecutionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TestCoverageOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TestFixOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TestGenerationOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TestFileCountOrderByAggregateInput = {
    id?: SortOrder
    filePath?: SortOrder
    fileName?: SortOrder
    firstSeen?: SortOrder
    lastUpdated?: SortOrder
    totalRuns?: SortOrder
    avgPassRate?: SortOrder
    currentPassRate?: SortOrder
    avgDuration?: SortOrder
    currentCoverage?: SortOrder
    avgCoverage?: SortOrder
    totalFixes?: SortOrder
    flakyTests?: SortOrder
    metadata?: SortOrder
    healthScore?: SortOrder
    totalTests?: SortOrder
    criticalTests?: SortOrder
    lastFailureReason?: SortOrder
  }

  export type TestFileAvgOrderByAggregateInput = {
    totalRuns?: SortOrder
    avgPassRate?: SortOrder
    currentPassRate?: SortOrder
    avgDuration?: SortOrder
    currentCoverage?: SortOrder
    avgCoverage?: SortOrder
    totalFixes?: SortOrder
    flakyTests?: SortOrder
    totalTests?: SortOrder
    criticalTests?: SortOrder
  }

  export type TestFileMaxOrderByAggregateInput = {
    id?: SortOrder
    filePath?: SortOrder
    fileName?: SortOrder
    firstSeen?: SortOrder
    lastUpdated?: SortOrder
    totalRuns?: SortOrder
    avgPassRate?: SortOrder
    currentPassRate?: SortOrder
    avgDuration?: SortOrder
    currentCoverage?: SortOrder
    avgCoverage?: SortOrder
    totalFixes?: SortOrder
    flakyTests?: SortOrder
    healthScore?: SortOrder
    totalTests?: SortOrder
    criticalTests?: SortOrder
    lastFailureReason?: SortOrder
  }

  export type TestFileMinOrderByAggregateInput = {
    id?: SortOrder
    filePath?: SortOrder
    fileName?: SortOrder
    firstSeen?: SortOrder
    lastUpdated?: SortOrder
    totalRuns?: SortOrder
    avgPassRate?: SortOrder
    currentPassRate?: SortOrder
    avgDuration?: SortOrder
    currentCoverage?: SortOrder
    avgCoverage?: SortOrder
    totalFixes?: SortOrder
    flakyTests?: SortOrder
    healthScore?: SortOrder
    totalTests?: SortOrder
    criticalTests?: SortOrder
    lastFailureReason?: SortOrder
  }

  export type TestFileSumOrderByAggregateInput = {
    totalRuns?: SortOrder
    avgPassRate?: SortOrder
    currentPassRate?: SortOrder
    avgDuration?: SortOrder
    currentCoverage?: SortOrder
    avgCoverage?: SortOrder
    totalFixes?: SortOrder
    flakyTests?: SortOrder
    totalTests?: SortOrder
    criticalTests?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type EnumTestHealthScoreWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TestHealthScore | EnumTestHealthScoreFieldRefInput<$PrismaModel>
    in?: $Enums.TestHealthScore[] | ListEnumTestHealthScoreFieldRefInput<$PrismaModel>
    notIn?: $Enums.TestHealthScore[] | ListEnumTestHealthScoreFieldRefInput<$PrismaModel>
    not?: NestedEnumTestHealthScoreWithAggregatesFilter<$PrismaModel> | $Enums.TestHealthScore
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTestHealthScoreFilter<$PrismaModel>
    _max?: NestedEnumTestHealthScoreFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }
  export type JsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type AnalysisSessionScalarRelationFilter = {
    is?: AnalysisSessionWhereInput
    isNot?: AnalysisSessionWhereInput
  }

  export type TestFileScalarRelationFilter = {
    is?: TestFileWhereInput
    isNot?: TestFileWhereInput
  }

  export type TestAnalysisCountOrderByAggregateInput = {
    id?: SortOrder
    sessionId?: SortOrder
    testFileId?: SortOrder
    patterns?: SortOrder
    antiPatterns?: SortOrder
    suggestions?: SortOrder
    context?: SortOrder
    timestamp?: SortOrder
  }

  export type TestAnalysisMaxOrderByAggregateInput = {
    id?: SortOrder
    sessionId?: SortOrder
    testFileId?: SortOrder
    timestamp?: SortOrder
  }

  export type TestAnalysisMinOrderByAggregateInput = {
    id?: SortOrder
    sessionId?: SortOrder
    testFileId?: SortOrder
    timestamp?: SortOrder
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type EnumPatternTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.PatternType | EnumPatternTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PatternType[] | ListEnumPatternTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.PatternType[] | ListEnumPatternTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumPatternTypeFilter<$PrismaModel> | $Enums.PatternType
  }

  export type TestPatternCountOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    pattern?: SortOrder
    context?: SortOrder
    successRate?: SortOrder
    usageCount?: SortOrder
    lastUsed?: SortOrder
    createdAt?: SortOrder
  }

  export type TestPatternAvgOrderByAggregateInput = {
    successRate?: SortOrder
    usageCount?: SortOrder
  }

  export type TestPatternMaxOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    pattern?: SortOrder
    successRate?: SortOrder
    usageCount?: SortOrder
    lastUsed?: SortOrder
    createdAt?: SortOrder
  }

  export type TestPatternMinOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    pattern?: SortOrder
    successRate?: SortOrder
    usageCount?: SortOrder
    lastUsed?: SortOrder
    createdAt?: SortOrder
  }

  export type TestPatternSumOrderByAggregateInput = {
    successRate?: SortOrder
    usageCount?: SortOrder
  }

  export type EnumPatternTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PatternType | EnumPatternTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PatternType[] | ListEnumPatternTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.PatternType[] | ListEnumPatternTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumPatternTypeWithAggregatesFilter<$PrismaModel> | $Enums.PatternType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPatternTypeFilter<$PrismaModel>
    _max?: NestedEnumPatternTypeFilter<$PrismaModel>
  }

  export type FixPatternCountOrderByAggregateInput = {
    id?: SortOrder
    problem?: SortOrder
    solution?: SortOrder
    context?: SortOrder
    successRate?: SortOrder
    usageCount?: SortOrder
    lastUsed?: SortOrder
    createdAt?: SortOrder
  }

  export type FixPatternAvgOrderByAggregateInput = {
    successRate?: SortOrder
    usageCount?: SortOrder
  }

  export type FixPatternMaxOrderByAggregateInput = {
    id?: SortOrder
    problem?: SortOrder
    solution?: SortOrder
    successRate?: SortOrder
    usageCount?: SortOrder
    lastUsed?: SortOrder
    createdAt?: SortOrder
  }

  export type FixPatternMinOrderByAggregateInput = {
    id?: SortOrder
    problem?: SortOrder
    solution?: SortOrder
    successRate?: SortOrder
    usageCount?: SortOrder
    lastUsed?: SortOrder
    createdAt?: SortOrder
  }

  export type FixPatternSumOrderByAggregateInput = {
    successRate?: SortOrder
    usageCount?: SortOrder
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type TestExecutionCountOrderByAggregateInput = {
    id?: SortOrder
    testFileId?: SortOrder
    executedAt?: SortOrder
    passed?: SortOrder
    duration?: SortOrder
    errorMessage?: SortOrder
    testResults?: SortOrder
    environment?: SortOrder
    commitHash?: SortOrder
    performance?: SortOrder
  }

  export type TestExecutionAvgOrderByAggregateInput = {
    duration?: SortOrder
  }

  export type TestExecutionMaxOrderByAggregateInput = {
    id?: SortOrder
    testFileId?: SortOrder
    executedAt?: SortOrder
    passed?: SortOrder
    duration?: SortOrder
    errorMessage?: SortOrder
    environment?: SortOrder
    commitHash?: SortOrder
  }

  export type TestExecutionMinOrderByAggregateInput = {
    id?: SortOrder
    testFileId?: SortOrder
    executedAt?: SortOrder
    passed?: SortOrder
    duration?: SortOrder
    errorMessage?: SortOrder
    environment?: SortOrder
    commitHash?: SortOrder
  }

  export type TestExecutionSumOrderByAggregateInput = {
    duration?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type TestCoverageCountOrderByAggregateInput = {
    id?: SortOrder
    testFileId?: SortOrder
    measuredAt?: SortOrder
    coveragePercent?: SortOrder
    linesCovered?: SortOrder
    linesUncovered?: SortOrder
    branchCoverage?: SortOrder
    functionCoverage?: SortOrder
    suggestedAreas?: SortOrder
    coverageType?: SortOrder
  }

  export type TestCoverageAvgOrderByAggregateInput = {
    coveragePercent?: SortOrder
  }

  export type TestCoverageMaxOrderByAggregateInput = {
    id?: SortOrder
    testFileId?: SortOrder
    measuredAt?: SortOrder
    coveragePercent?: SortOrder
    coverageType?: SortOrder
  }

  export type TestCoverageMinOrderByAggregateInput = {
    id?: SortOrder
    testFileId?: SortOrder
    measuredAt?: SortOrder
    coveragePercent?: SortOrder
    coverageType?: SortOrder
  }

  export type TestCoverageSumOrderByAggregateInput = {
    coveragePercent?: SortOrder
  }

  export type EnumFixTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.FixType | EnumFixTypeFieldRefInput<$PrismaModel>
    in?: $Enums.FixType[] | ListEnumFixTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.FixType[] | ListEnumFixTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumFixTypeFilter<$PrismaModel> | $Enums.FixType
  }

  export type TestFixCountOrderByAggregateInput = {
    id?: SortOrder
    testFileId?: SortOrder
    appliedAt?: SortOrder
    fixType?: SortOrder
    problem?: SortOrder
    solution?: SortOrder
    successful?: SortOrder
    confidenceScore?: SortOrder
    beforeState?: SortOrder
    afterState?: SortOrder
    patternUsed?: SortOrder
    impactScore?: SortOrder
  }

  export type TestFixAvgOrderByAggregateInput = {
    confidenceScore?: SortOrder
    impactScore?: SortOrder
  }

  export type TestFixMaxOrderByAggregateInput = {
    id?: SortOrder
    testFileId?: SortOrder
    appliedAt?: SortOrder
    fixType?: SortOrder
    problem?: SortOrder
    solution?: SortOrder
    successful?: SortOrder
    confidenceScore?: SortOrder
    patternUsed?: SortOrder
    impactScore?: SortOrder
  }

  export type TestFixMinOrderByAggregateInput = {
    id?: SortOrder
    testFileId?: SortOrder
    appliedAt?: SortOrder
    fixType?: SortOrder
    problem?: SortOrder
    solution?: SortOrder
    successful?: SortOrder
    confidenceScore?: SortOrder
    patternUsed?: SortOrder
    impactScore?: SortOrder
  }

  export type TestFixSumOrderByAggregateInput = {
    confidenceScore?: SortOrder
    impactScore?: SortOrder
  }

  export type EnumFixTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.FixType | EnumFixTypeFieldRefInput<$PrismaModel>
    in?: $Enums.FixType[] | ListEnumFixTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.FixType[] | ListEnumFixTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumFixTypeWithAggregatesFilter<$PrismaModel> | $Enums.FixType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumFixTypeFilter<$PrismaModel>
    _max?: NestedEnumFixTypeFilter<$PrismaModel>
  }

  export type EnumGenerationTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.GenerationType | EnumGenerationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.GenerationType[] | ListEnumGenerationTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.GenerationType[] | ListEnumGenerationTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumGenerationTypeFilter<$PrismaModel> | $Enums.GenerationType
  }

  export type TestGenerationCountOrderByAggregateInput = {
    id?: SortOrder
    testFileId?: SortOrder
    generatedAt?: SortOrder
    generationType?: SortOrder
    newTests?: SortOrder
    accepted?: SortOrder
    targetArea?: SortOrder
    coverageImprovement?: SortOrder
    generationStrategy?: SortOrder
    context?: SortOrder
  }

  export type TestGenerationAvgOrderByAggregateInput = {
    coverageImprovement?: SortOrder
  }

  export type TestGenerationMaxOrderByAggregateInput = {
    id?: SortOrder
    testFileId?: SortOrder
    generatedAt?: SortOrder
    generationType?: SortOrder
    accepted?: SortOrder
    targetArea?: SortOrder
    coverageImprovement?: SortOrder
    generationStrategy?: SortOrder
  }

  export type TestGenerationMinOrderByAggregateInput = {
    id?: SortOrder
    testFileId?: SortOrder
    generatedAt?: SortOrder
    generationType?: SortOrder
    accepted?: SortOrder
    targetArea?: SortOrder
    coverageImprovement?: SortOrder
    generationStrategy?: SortOrder
  }

  export type TestGenerationSumOrderByAggregateInput = {
    coverageImprovement?: SortOrder
  }

  export type EnumGenerationTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.GenerationType | EnumGenerationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.GenerationType[] | ListEnumGenerationTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.GenerationType[] | ListEnumGenerationTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumGenerationTypeWithAggregatesFilter<$PrismaModel> | $Enums.GenerationType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumGenerationTypeFilter<$PrismaModel>
    _max?: NestedEnumGenerationTypeFilter<$PrismaModel>
  }

  export type AnalysisSessionCreatedecisionsInput = {
    set: InputJsonValue[]
  }

  export type AnalysisSessionCreateoperationsInput = {
    set: InputJsonValue[]
  }

  export type TestFileCreateNestedManyWithoutSessionsInput = {
    create?: XOR<TestFileCreateWithoutSessionsInput, TestFileUncheckedCreateWithoutSessionsInput> | TestFileCreateWithoutSessionsInput[] | TestFileUncheckedCreateWithoutSessionsInput[]
    connectOrCreate?: TestFileCreateOrConnectWithoutSessionsInput | TestFileCreateOrConnectWithoutSessionsInput[]
    connect?: TestFileWhereUniqueInput | TestFileWhereUniqueInput[]
  }

  export type TestAnalysisCreateNestedManyWithoutSessionInput = {
    create?: XOR<TestAnalysisCreateWithoutSessionInput, TestAnalysisUncheckedCreateWithoutSessionInput> | TestAnalysisCreateWithoutSessionInput[] | TestAnalysisUncheckedCreateWithoutSessionInput[]
    connectOrCreate?: TestAnalysisCreateOrConnectWithoutSessionInput | TestAnalysisCreateOrConnectWithoutSessionInput[]
    createMany?: TestAnalysisCreateManySessionInputEnvelope
    connect?: TestAnalysisWhereUniqueInput | TestAnalysisWhereUniqueInput[]
  }

  export type TestFileUncheckedCreateNestedManyWithoutSessionsInput = {
    create?: XOR<TestFileCreateWithoutSessionsInput, TestFileUncheckedCreateWithoutSessionsInput> | TestFileCreateWithoutSessionsInput[] | TestFileUncheckedCreateWithoutSessionsInput[]
    connectOrCreate?: TestFileCreateOrConnectWithoutSessionsInput | TestFileCreateOrConnectWithoutSessionsInput[]
    connect?: TestFileWhereUniqueInput | TestFileWhereUniqueInput[]
  }

  export type TestAnalysisUncheckedCreateNestedManyWithoutSessionInput = {
    create?: XOR<TestAnalysisCreateWithoutSessionInput, TestAnalysisUncheckedCreateWithoutSessionInput> | TestAnalysisCreateWithoutSessionInput[] | TestAnalysisUncheckedCreateWithoutSessionInput[]
    connectOrCreate?: TestAnalysisCreateOrConnectWithoutSessionInput | TestAnalysisCreateOrConnectWithoutSessionInput[]
    createMany?: TestAnalysisCreateManySessionInputEnvelope
    connect?: TestAnalysisWhereUniqueInput | TestAnalysisWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type EnumSessionStatusFieldUpdateOperationsInput = {
    set?: $Enums.SessionStatus
  }

  export type AnalysisSessionUpdatedecisionsInput = {
    set?: InputJsonValue[]
    push?: InputJsonValue | InputJsonValue[]
  }

  export type AnalysisSessionUpdateoperationsInput = {
    set?: InputJsonValue[]
    push?: InputJsonValue | InputJsonValue[]
  }

  export type TestFileUpdateManyWithoutSessionsNestedInput = {
    create?: XOR<TestFileCreateWithoutSessionsInput, TestFileUncheckedCreateWithoutSessionsInput> | TestFileCreateWithoutSessionsInput[] | TestFileUncheckedCreateWithoutSessionsInput[]
    connectOrCreate?: TestFileCreateOrConnectWithoutSessionsInput | TestFileCreateOrConnectWithoutSessionsInput[]
    upsert?: TestFileUpsertWithWhereUniqueWithoutSessionsInput | TestFileUpsertWithWhereUniqueWithoutSessionsInput[]
    set?: TestFileWhereUniqueInput | TestFileWhereUniqueInput[]
    disconnect?: TestFileWhereUniqueInput | TestFileWhereUniqueInput[]
    delete?: TestFileWhereUniqueInput | TestFileWhereUniqueInput[]
    connect?: TestFileWhereUniqueInput | TestFileWhereUniqueInput[]
    update?: TestFileUpdateWithWhereUniqueWithoutSessionsInput | TestFileUpdateWithWhereUniqueWithoutSessionsInput[]
    updateMany?: TestFileUpdateManyWithWhereWithoutSessionsInput | TestFileUpdateManyWithWhereWithoutSessionsInput[]
    deleteMany?: TestFileScalarWhereInput | TestFileScalarWhereInput[]
  }

  export type TestAnalysisUpdateManyWithoutSessionNestedInput = {
    create?: XOR<TestAnalysisCreateWithoutSessionInput, TestAnalysisUncheckedCreateWithoutSessionInput> | TestAnalysisCreateWithoutSessionInput[] | TestAnalysisUncheckedCreateWithoutSessionInput[]
    connectOrCreate?: TestAnalysisCreateOrConnectWithoutSessionInput | TestAnalysisCreateOrConnectWithoutSessionInput[]
    upsert?: TestAnalysisUpsertWithWhereUniqueWithoutSessionInput | TestAnalysisUpsertWithWhereUniqueWithoutSessionInput[]
    createMany?: TestAnalysisCreateManySessionInputEnvelope
    set?: TestAnalysisWhereUniqueInput | TestAnalysisWhereUniqueInput[]
    disconnect?: TestAnalysisWhereUniqueInput | TestAnalysisWhereUniqueInput[]
    delete?: TestAnalysisWhereUniqueInput | TestAnalysisWhereUniqueInput[]
    connect?: TestAnalysisWhereUniqueInput | TestAnalysisWhereUniqueInput[]
    update?: TestAnalysisUpdateWithWhereUniqueWithoutSessionInput | TestAnalysisUpdateWithWhereUniqueWithoutSessionInput[]
    updateMany?: TestAnalysisUpdateManyWithWhereWithoutSessionInput | TestAnalysisUpdateManyWithWhereWithoutSessionInput[]
    deleteMany?: TestAnalysisScalarWhereInput | TestAnalysisScalarWhereInput[]
  }

  export type TestFileUncheckedUpdateManyWithoutSessionsNestedInput = {
    create?: XOR<TestFileCreateWithoutSessionsInput, TestFileUncheckedCreateWithoutSessionsInput> | TestFileCreateWithoutSessionsInput[] | TestFileUncheckedCreateWithoutSessionsInput[]
    connectOrCreate?: TestFileCreateOrConnectWithoutSessionsInput | TestFileCreateOrConnectWithoutSessionsInput[]
    upsert?: TestFileUpsertWithWhereUniqueWithoutSessionsInput | TestFileUpsertWithWhereUniqueWithoutSessionsInput[]
    set?: TestFileWhereUniqueInput | TestFileWhereUniqueInput[]
    disconnect?: TestFileWhereUniqueInput | TestFileWhereUniqueInput[]
    delete?: TestFileWhereUniqueInput | TestFileWhereUniqueInput[]
    connect?: TestFileWhereUniqueInput | TestFileWhereUniqueInput[]
    update?: TestFileUpdateWithWhereUniqueWithoutSessionsInput | TestFileUpdateWithWhereUniqueWithoutSessionsInput[]
    updateMany?: TestFileUpdateManyWithWhereWithoutSessionsInput | TestFileUpdateManyWithWhereWithoutSessionsInput[]
    deleteMany?: TestFileScalarWhereInput | TestFileScalarWhereInput[]
  }

  export type TestAnalysisUncheckedUpdateManyWithoutSessionNestedInput = {
    create?: XOR<TestAnalysisCreateWithoutSessionInput, TestAnalysisUncheckedCreateWithoutSessionInput> | TestAnalysisCreateWithoutSessionInput[] | TestAnalysisUncheckedCreateWithoutSessionInput[]
    connectOrCreate?: TestAnalysisCreateOrConnectWithoutSessionInput | TestAnalysisCreateOrConnectWithoutSessionInput[]
    upsert?: TestAnalysisUpsertWithWhereUniqueWithoutSessionInput | TestAnalysisUpsertWithWhereUniqueWithoutSessionInput[]
    createMany?: TestAnalysisCreateManySessionInputEnvelope
    set?: TestAnalysisWhereUniqueInput | TestAnalysisWhereUniqueInput[]
    disconnect?: TestAnalysisWhereUniqueInput | TestAnalysisWhereUniqueInput[]
    delete?: TestAnalysisWhereUniqueInput | TestAnalysisWhereUniqueInput[]
    connect?: TestAnalysisWhereUniqueInput | TestAnalysisWhereUniqueInput[]
    update?: TestAnalysisUpdateWithWhereUniqueWithoutSessionInput | TestAnalysisUpdateWithWhereUniqueWithoutSessionInput[]
    updateMany?: TestAnalysisUpdateManyWithWhereWithoutSessionInput | TestAnalysisUpdateManyWithWhereWithoutSessionInput[]
    deleteMany?: TestAnalysisScalarWhereInput | TestAnalysisScalarWhereInput[]
  }

  export type AnalysisSessionCreateNestedManyWithoutTestFilesInput = {
    create?: XOR<AnalysisSessionCreateWithoutTestFilesInput, AnalysisSessionUncheckedCreateWithoutTestFilesInput> | AnalysisSessionCreateWithoutTestFilesInput[] | AnalysisSessionUncheckedCreateWithoutTestFilesInput[]
    connectOrCreate?: AnalysisSessionCreateOrConnectWithoutTestFilesInput | AnalysisSessionCreateOrConnectWithoutTestFilesInput[]
    connect?: AnalysisSessionWhereUniqueInput | AnalysisSessionWhereUniqueInput[]
  }

  export type TestExecutionCreateNestedManyWithoutTestFileInput = {
    create?: XOR<TestExecutionCreateWithoutTestFileInput, TestExecutionUncheckedCreateWithoutTestFileInput> | TestExecutionCreateWithoutTestFileInput[] | TestExecutionUncheckedCreateWithoutTestFileInput[]
    connectOrCreate?: TestExecutionCreateOrConnectWithoutTestFileInput | TestExecutionCreateOrConnectWithoutTestFileInput[]
    createMany?: TestExecutionCreateManyTestFileInputEnvelope
    connect?: TestExecutionWhereUniqueInput | TestExecutionWhereUniqueInput[]
  }

  export type TestCoverageCreateNestedManyWithoutTestFileInput = {
    create?: XOR<TestCoverageCreateWithoutTestFileInput, TestCoverageUncheckedCreateWithoutTestFileInput> | TestCoverageCreateWithoutTestFileInput[] | TestCoverageUncheckedCreateWithoutTestFileInput[]
    connectOrCreate?: TestCoverageCreateOrConnectWithoutTestFileInput | TestCoverageCreateOrConnectWithoutTestFileInput[]
    createMany?: TestCoverageCreateManyTestFileInputEnvelope
    connect?: TestCoverageWhereUniqueInput | TestCoverageWhereUniqueInput[]
  }

  export type TestFixCreateNestedManyWithoutTestFileInput = {
    create?: XOR<TestFixCreateWithoutTestFileInput, TestFixUncheckedCreateWithoutTestFileInput> | TestFixCreateWithoutTestFileInput[] | TestFixUncheckedCreateWithoutTestFileInput[]
    connectOrCreate?: TestFixCreateOrConnectWithoutTestFileInput | TestFixCreateOrConnectWithoutTestFileInput[]
    createMany?: TestFixCreateManyTestFileInputEnvelope
    connect?: TestFixWhereUniqueInput | TestFixWhereUniqueInput[]
  }

  export type TestGenerationCreateNestedManyWithoutTestFileInput = {
    create?: XOR<TestGenerationCreateWithoutTestFileInput, TestGenerationUncheckedCreateWithoutTestFileInput> | TestGenerationCreateWithoutTestFileInput[] | TestGenerationUncheckedCreateWithoutTestFileInput[]
    connectOrCreate?: TestGenerationCreateOrConnectWithoutTestFileInput | TestGenerationCreateOrConnectWithoutTestFileInput[]
    createMany?: TestGenerationCreateManyTestFileInputEnvelope
    connect?: TestGenerationWhereUniqueInput | TestGenerationWhereUniqueInput[]
  }

  export type TestAnalysisCreateNestedManyWithoutTestFileInput = {
    create?: XOR<TestAnalysisCreateWithoutTestFileInput, TestAnalysisUncheckedCreateWithoutTestFileInput> | TestAnalysisCreateWithoutTestFileInput[] | TestAnalysisUncheckedCreateWithoutTestFileInput[]
    connectOrCreate?: TestAnalysisCreateOrConnectWithoutTestFileInput | TestAnalysisCreateOrConnectWithoutTestFileInput[]
    createMany?: TestAnalysisCreateManyTestFileInputEnvelope
    connect?: TestAnalysisWhereUniqueInput | TestAnalysisWhereUniqueInput[]
  }

  export type AnalysisSessionUncheckedCreateNestedManyWithoutTestFilesInput = {
    create?: XOR<AnalysisSessionCreateWithoutTestFilesInput, AnalysisSessionUncheckedCreateWithoutTestFilesInput> | AnalysisSessionCreateWithoutTestFilesInput[] | AnalysisSessionUncheckedCreateWithoutTestFilesInput[]
    connectOrCreate?: AnalysisSessionCreateOrConnectWithoutTestFilesInput | AnalysisSessionCreateOrConnectWithoutTestFilesInput[]
    connect?: AnalysisSessionWhereUniqueInput | AnalysisSessionWhereUniqueInput[]
  }

  export type TestExecutionUncheckedCreateNestedManyWithoutTestFileInput = {
    create?: XOR<TestExecutionCreateWithoutTestFileInput, TestExecutionUncheckedCreateWithoutTestFileInput> | TestExecutionCreateWithoutTestFileInput[] | TestExecutionUncheckedCreateWithoutTestFileInput[]
    connectOrCreate?: TestExecutionCreateOrConnectWithoutTestFileInput | TestExecutionCreateOrConnectWithoutTestFileInput[]
    createMany?: TestExecutionCreateManyTestFileInputEnvelope
    connect?: TestExecutionWhereUniqueInput | TestExecutionWhereUniqueInput[]
  }

  export type TestCoverageUncheckedCreateNestedManyWithoutTestFileInput = {
    create?: XOR<TestCoverageCreateWithoutTestFileInput, TestCoverageUncheckedCreateWithoutTestFileInput> | TestCoverageCreateWithoutTestFileInput[] | TestCoverageUncheckedCreateWithoutTestFileInput[]
    connectOrCreate?: TestCoverageCreateOrConnectWithoutTestFileInput | TestCoverageCreateOrConnectWithoutTestFileInput[]
    createMany?: TestCoverageCreateManyTestFileInputEnvelope
    connect?: TestCoverageWhereUniqueInput | TestCoverageWhereUniqueInput[]
  }

  export type TestFixUncheckedCreateNestedManyWithoutTestFileInput = {
    create?: XOR<TestFixCreateWithoutTestFileInput, TestFixUncheckedCreateWithoutTestFileInput> | TestFixCreateWithoutTestFileInput[] | TestFixUncheckedCreateWithoutTestFileInput[]
    connectOrCreate?: TestFixCreateOrConnectWithoutTestFileInput | TestFixCreateOrConnectWithoutTestFileInput[]
    createMany?: TestFixCreateManyTestFileInputEnvelope
    connect?: TestFixWhereUniqueInput | TestFixWhereUniqueInput[]
  }

  export type TestGenerationUncheckedCreateNestedManyWithoutTestFileInput = {
    create?: XOR<TestGenerationCreateWithoutTestFileInput, TestGenerationUncheckedCreateWithoutTestFileInput> | TestGenerationCreateWithoutTestFileInput[] | TestGenerationUncheckedCreateWithoutTestFileInput[]
    connectOrCreate?: TestGenerationCreateOrConnectWithoutTestFileInput | TestGenerationCreateOrConnectWithoutTestFileInput[]
    createMany?: TestGenerationCreateManyTestFileInputEnvelope
    connect?: TestGenerationWhereUniqueInput | TestGenerationWhereUniqueInput[]
  }

  export type TestAnalysisUncheckedCreateNestedManyWithoutTestFileInput = {
    create?: XOR<TestAnalysisCreateWithoutTestFileInput, TestAnalysisUncheckedCreateWithoutTestFileInput> | TestAnalysisCreateWithoutTestFileInput[] | TestAnalysisUncheckedCreateWithoutTestFileInput[]
    connectOrCreate?: TestAnalysisCreateOrConnectWithoutTestFileInput | TestAnalysisCreateOrConnectWithoutTestFileInput[]
    createMany?: TestAnalysisCreateManyTestFileInputEnvelope
    connect?: TestAnalysisWhereUniqueInput | TestAnalysisWhereUniqueInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type EnumTestHealthScoreFieldUpdateOperationsInput = {
    set?: $Enums.TestHealthScore
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type AnalysisSessionUpdateManyWithoutTestFilesNestedInput = {
    create?: XOR<AnalysisSessionCreateWithoutTestFilesInput, AnalysisSessionUncheckedCreateWithoutTestFilesInput> | AnalysisSessionCreateWithoutTestFilesInput[] | AnalysisSessionUncheckedCreateWithoutTestFilesInput[]
    connectOrCreate?: AnalysisSessionCreateOrConnectWithoutTestFilesInput | AnalysisSessionCreateOrConnectWithoutTestFilesInput[]
    upsert?: AnalysisSessionUpsertWithWhereUniqueWithoutTestFilesInput | AnalysisSessionUpsertWithWhereUniqueWithoutTestFilesInput[]
    set?: AnalysisSessionWhereUniqueInput | AnalysisSessionWhereUniqueInput[]
    disconnect?: AnalysisSessionWhereUniqueInput | AnalysisSessionWhereUniqueInput[]
    delete?: AnalysisSessionWhereUniqueInput | AnalysisSessionWhereUniqueInput[]
    connect?: AnalysisSessionWhereUniqueInput | AnalysisSessionWhereUniqueInput[]
    update?: AnalysisSessionUpdateWithWhereUniqueWithoutTestFilesInput | AnalysisSessionUpdateWithWhereUniqueWithoutTestFilesInput[]
    updateMany?: AnalysisSessionUpdateManyWithWhereWithoutTestFilesInput | AnalysisSessionUpdateManyWithWhereWithoutTestFilesInput[]
    deleteMany?: AnalysisSessionScalarWhereInput | AnalysisSessionScalarWhereInput[]
  }

  export type TestExecutionUpdateManyWithoutTestFileNestedInput = {
    create?: XOR<TestExecutionCreateWithoutTestFileInput, TestExecutionUncheckedCreateWithoutTestFileInput> | TestExecutionCreateWithoutTestFileInput[] | TestExecutionUncheckedCreateWithoutTestFileInput[]
    connectOrCreate?: TestExecutionCreateOrConnectWithoutTestFileInput | TestExecutionCreateOrConnectWithoutTestFileInput[]
    upsert?: TestExecutionUpsertWithWhereUniqueWithoutTestFileInput | TestExecutionUpsertWithWhereUniqueWithoutTestFileInput[]
    createMany?: TestExecutionCreateManyTestFileInputEnvelope
    set?: TestExecutionWhereUniqueInput | TestExecutionWhereUniqueInput[]
    disconnect?: TestExecutionWhereUniqueInput | TestExecutionWhereUniqueInput[]
    delete?: TestExecutionWhereUniqueInput | TestExecutionWhereUniqueInput[]
    connect?: TestExecutionWhereUniqueInput | TestExecutionWhereUniqueInput[]
    update?: TestExecutionUpdateWithWhereUniqueWithoutTestFileInput | TestExecutionUpdateWithWhereUniqueWithoutTestFileInput[]
    updateMany?: TestExecutionUpdateManyWithWhereWithoutTestFileInput | TestExecutionUpdateManyWithWhereWithoutTestFileInput[]
    deleteMany?: TestExecutionScalarWhereInput | TestExecutionScalarWhereInput[]
  }

  export type TestCoverageUpdateManyWithoutTestFileNestedInput = {
    create?: XOR<TestCoverageCreateWithoutTestFileInput, TestCoverageUncheckedCreateWithoutTestFileInput> | TestCoverageCreateWithoutTestFileInput[] | TestCoverageUncheckedCreateWithoutTestFileInput[]
    connectOrCreate?: TestCoverageCreateOrConnectWithoutTestFileInput | TestCoverageCreateOrConnectWithoutTestFileInput[]
    upsert?: TestCoverageUpsertWithWhereUniqueWithoutTestFileInput | TestCoverageUpsertWithWhereUniqueWithoutTestFileInput[]
    createMany?: TestCoverageCreateManyTestFileInputEnvelope
    set?: TestCoverageWhereUniqueInput | TestCoverageWhereUniqueInput[]
    disconnect?: TestCoverageWhereUniqueInput | TestCoverageWhereUniqueInput[]
    delete?: TestCoverageWhereUniqueInput | TestCoverageWhereUniqueInput[]
    connect?: TestCoverageWhereUniqueInput | TestCoverageWhereUniqueInput[]
    update?: TestCoverageUpdateWithWhereUniqueWithoutTestFileInput | TestCoverageUpdateWithWhereUniqueWithoutTestFileInput[]
    updateMany?: TestCoverageUpdateManyWithWhereWithoutTestFileInput | TestCoverageUpdateManyWithWhereWithoutTestFileInput[]
    deleteMany?: TestCoverageScalarWhereInput | TestCoverageScalarWhereInput[]
  }

  export type TestFixUpdateManyWithoutTestFileNestedInput = {
    create?: XOR<TestFixCreateWithoutTestFileInput, TestFixUncheckedCreateWithoutTestFileInput> | TestFixCreateWithoutTestFileInput[] | TestFixUncheckedCreateWithoutTestFileInput[]
    connectOrCreate?: TestFixCreateOrConnectWithoutTestFileInput | TestFixCreateOrConnectWithoutTestFileInput[]
    upsert?: TestFixUpsertWithWhereUniqueWithoutTestFileInput | TestFixUpsertWithWhereUniqueWithoutTestFileInput[]
    createMany?: TestFixCreateManyTestFileInputEnvelope
    set?: TestFixWhereUniqueInput | TestFixWhereUniqueInput[]
    disconnect?: TestFixWhereUniqueInput | TestFixWhereUniqueInput[]
    delete?: TestFixWhereUniqueInput | TestFixWhereUniqueInput[]
    connect?: TestFixWhereUniqueInput | TestFixWhereUniqueInput[]
    update?: TestFixUpdateWithWhereUniqueWithoutTestFileInput | TestFixUpdateWithWhereUniqueWithoutTestFileInput[]
    updateMany?: TestFixUpdateManyWithWhereWithoutTestFileInput | TestFixUpdateManyWithWhereWithoutTestFileInput[]
    deleteMany?: TestFixScalarWhereInput | TestFixScalarWhereInput[]
  }

  export type TestGenerationUpdateManyWithoutTestFileNestedInput = {
    create?: XOR<TestGenerationCreateWithoutTestFileInput, TestGenerationUncheckedCreateWithoutTestFileInput> | TestGenerationCreateWithoutTestFileInput[] | TestGenerationUncheckedCreateWithoutTestFileInput[]
    connectOrCreate?: TestGenerationCreateOrConnectWithoutTestFileInput | TestGenerationCreateOrConnectWithoutTestFileInput[]
    upsert?: TestGenerationUpsertWithWhereUniqueWithoutTestFileInput | TestGenerationUpsertWithWhereUniqueWithoutTestFileInput[]
    createMany?: TestGenerationCreateManyTestFileInputEnvelope
    set?: TestGenerationWhereUniqueInput | TestGenerationWhereUniqueInput[]
    disconnect?: TestGenerationWhereUniqueInput | TestGenerationWhereUniqueInput[]
    delete?: TestGenerationWhereUniqueInput | TestGenerationWhereUniqueInput[]
    connect?: TestGenerationWhereUniqueInput | TestGenerationWhereUniqueInput[]
    update?: TestGenerationUpdateWithWhereUniqueWithoutTestFileInput | TestGenerationUpdateWithWhereUniqueWithoutTestFileInput[]
    updateMany?: TestGenerationUpdateManyWithWhereWithoutTestFileInput | TestGenerationUpdateManyWithWhereWithoutTestFileInput[]
    deleteMany?: TestGenerationScalarWhereInput | TestGenerationScalarWhereInput[]
  }

  export type TestAnalysisUpdateManyWithoutTestFileNestedInput = {
    create?: XOR<TestAnalysisCreateWithoutTestFileInput, TestAnalysisUncheckedCreateWithoutTestFileInput> | TestAnalysisCreateWithoutTestFileInput[] | TestAnalysisUncheckedCreateWithoutTestFileInput[]
    connectOrCreate?: TestAnalysisCreateOrConnectWithoutTestFileInput | TestAnalysisCreateOrConnectWithoutTestFileInput[]
    upsert?: TestAnalysisUpsertWithWhereUniqueWithoutTestFileInput | TestAnalysisUpsertWithWhereUniqueWithoutTestFileInput[]
    createMany?: TestAnalysisCreateManyTestFileInputEnvelope
    set?: TestAnalysisWhereUniqueInput | TestAnalysisWhereUniqueInput[]
    disconnect?: TestAnalysisWhereUniqueInput | TestAnalysisWhereUniqueInput[]
    delete?: TestAnalysisWhereUniqueInput | TestAnalysisWhereUniqueInput[]
    connect?: TestAnalysisWhereUniqueInput | TestAnalysisWhereUniqueInput[]
    update?: TestAnalysisUpdateWithWhereUniqueWithoutTestFileInput | TestAnalysisUpdateWithWhereUniqueWithoutTestFileInput[]
    updateMany?: TestAnalysisUpdateManyWithWhereWithoutTestFileInput | TestAnalysisUpdateManyWithWhereWithoutTestFileInput[]
    deleteMany?: TestAnalysisScalarWhereInput | TestAnalysisScalarWhereInput[]
  }

  export type AnalysisSessionUncheckedUpdateManyWithoutTestFilesNestedInput = {
    create?: XOR<AnalysisSessionCreateWithoutTestFilesInput, AnalysisSessionUncheckedCreateWithoutTestFilesInput> | AnalysisSessionCreateWithoutTestFilesInput[] | AnalysisSessionUncheckedCreateWithoutTestFilesInput[]
    connectOrCreate?: AnalysisSessionCreateOrConnectWithoutTestFilesInput | AnalysisSessionCreateOrConnectWithoutTestFilesInput[]
    upsert?: AnalysisSessionUpsertWithWhereUniqueWithoutTestFilesInput | AnalysisSessionUpsertWithWhereUniqueWithoutTestFilesInput[]
    set?: AnalysisSessionWhereUniqueInput | AnalysisSessionWhereUniqueInput[]
    disconnect?: AnalysisSessionWhereUniqueInput | AnalysisSessionWhereUniqueInput[]
    delete?: AnalysisSessionWhereUniqueInput | AnalysisSessionWhereUniqueInput[]
    connect?: AnalysisSessionWhereUniqueInput | AnalysisSessionWhereUniqueInput[]
    update?: AnalysisSessionUpdateWithWhereUniqueWithoutTestFilesInput | AnalysisSessionUpdateWithWhereUniqueWithoutTestFilesInput[]
    updateMany?: AnalysisSessionUpdateManyWithWhereWithoutTestFilesInput | AnalysisSessionUpdateManyWithWhereWithoutTestFilesInput[]
    deleteMany?: AnalysisSessionScalarWhereInput | AnalysisSessionScalarWhereInput[]
  }

  export type TestExecutionUncheckedUpdateManyWithoutTestFileNestedInput = {
    create?: XOR<TestExecutionCreateWithoutTestFileInput, TestExecutionUncheckedCreateWithoutTestFileInput> | TestExecutionCreateWithoutTestFileInput[] | TestExecutionUncheckedCreateWithoutTestFileInput[]
    connectOrCreate?: TestExecutionCreateOrConnectWithoutTestFileInput | TestExecutionCreateOrConnectWithoutTestFileInput[]
    upsert?: TestExecutionUpsertWithWhereUniqueWithoutTestFileInput | TestExecutionUpsertWithWhereUniqueWithoutTestFileInput[]
    createMany?: TestExecutionCreateManyTestFileInputEnvelope
    set?: TestExecutionWhereUniqueInput | TestExecutionWhereUniqueInput[]
    disconnect?: TestExecutionWhereUniqueInput | TestExecutionWhereUniqueInput[]
    delete?: TestExecutionWhereUniqueInput | TestExecutionWhereUniqueInput[]
    connect?: TestExecutionWhereUniqueInput | TestExecutionWhereUniqueInput[]
    update?: TestExecutionUpdateWithWhereUniqueWithoutTestFileInput | TestExecutionUpdateWithWhereUniqueWithoutTestFileInput[]
    updateMany?: TestExecutionUpdateManyWithWhereWithoutTestFileInput | TestExecutionUpdateManyWithWhereWithoutTestFileInput[]
    deleteMany?: TestExecutionScalarWhereInput | TestExecutionScalarWhereInput[]
  }

  export type TestCoverageUncheckedUpdateManyWithoutTestFileNestedInput = {
    create?: XOR<TestCoverageCreateWithoutTestFileInput, TestCoverageUncheckedCreateWithoutTestFileInput> | TestCoverageCreateWithoutTestFileInput[] | TestCoverageUncheckedCreateWithoutTestFileInput[]
    connectOrCreate?: TestCoverageCreateOrConnectWithoutTestFileInput | TestCoverageCreateOrConnectWithoutTestFileInput[]
    upsert?: TestCoverageUpsertWithWhereUniqueWithoutTestFileInput | TestCoverageUpsertWithWhereUniqueWithoutTestFileInput[]
    createMany?: TestCoverageCreateManyTestFileInputEnvelope
    set?: TestCoverageWhereUniqueInput | TestCoverageWhereUniqueInput[]
    disconnect?: TestCoverageWhereUniqueInput | TestCoverageWhereUniqueInput[]
    delete?: TestCoverageWhereUniqueInput | TestCoverageWhereUniqueInput[]
    connect?: TestCoverageWhereUniqueInput | TestCoverageWhereUniqueInput[]
    update?: TestCoverageUpdateWithWhereUniqueWithoutTestFileInput | TestCoverageUpdateWithWhereUniqueWithoutTestFileInput[]
    updateMany?: TestCoverageUpdateManyWithWhereWithoutTestFileInput | TestCoverageUpdateManyWithWhereWithoutTestFileInput[]
    deleteMany?: TestCoverageScalarWhereInput | TestCoverageScalarWhereInput[]
  }

  export type TestFixUncheckedUpdateManyWithoutTestFileNestedInput = {
    create?: XOR<TestFixCreateWithoutTestFileInput, TestFixUncheckedCreateWithoutTestFileInput> | TestFixCreateWithoutTestFileInput[] | TestFixUncheckedCreateWithoutTestFileInput[]
    connectOrCreate?: TestFixCreateOrConnectWithoutTestFileInput | TestFixCreateOrConnectWithoutTestFileInput[]
    upsert?: TestFixUpsertWithWhereUniqueWithoutTestFileInput | TestFixUpsertWithWhereUniqueWithoutTestFileInput[]
    createMany?: TestFixCreateManyTestFileInputEnvelope
    set?: TestFixWhereUniqueInput | TestFixWhereUniqueInput[]
    disconnect?: TestFixWhereUniqueInput | TestFixWhereUniqueInput[]
    delete?: TestFixWhereUniqueInput | TestFixWhereUniqueInput[]
    connect?: TestFixWhereUniqueInput | TestFixWhereUniqueInput[]
    update?: TestFixUpdateWithWhereUniqueWithoutTestFileInput | TestFixUpdateWithWhereUniqueWithoutTestFileInput[]
    updateMany?: TestFixUpdateManyWithWhereWithoutTestFileInput | TestFixUpdateManyWithWhereWithoutTestFileInput[]
    deleteMany?: TestFixScalarWhereInput | TestFixScalarWhereInput[]
  }

  export type TestGenerationUncheckedUpdateManyWithoutTestFileNestedInput = {
    create?: XOR<TestGenerationCreateWithoutTestFileInput, TestGenerationUncheckedCreateWithoutTestFileInput> | TestGenerationCreateWithoutTestFileInput[] | TestGenerationUncheckedCreateWithoutTestFileInput[]
    connectOrCreate?: TestGenerationCreateOrConnectWithoutTestFileInput | TestGenerationCreateOrConnectWithoutTestFileInput[]
    upsert?: TestGenerationUpsertWithWhereUniqueWithoutTestFileInput | TestGenerationUpsertWithWhereUniqueWithoutTestFileInput[]
    createMany?: TestGenerationCreateManyTestFileInputEnvelope
    set?: TestGenerationWhereUniqueInput | TestGenerationWhereUniqueInput[]
    disconnect?: TestGenerationWhereUniqueInput | TestGenerationWhereUniqueInput[]
    delete?: TestGenerationWhereUniqueInput | TestGenerationWhereUniqueInput[]
    connect?: TestGenerationWhereUniqueInput | TestGenerationWhereUniqueInput[]
    update?: TestGenerationUpdateWithWhereUniqueWithoutTestFileInput | TestGenerationUpdateWithWhereUniqueWithoutTestFileInput[]
    updateMany?: TestGenerationUpdateManyWithWhereWithoutTestFileInput | TestGenerationUpdateManyWithWhereWithoutTestFileInput[]
    deleteMany?: TestGenerationScalarWhereInput | TestGenerationScalarWhereInput[]
  }

  export type TestAnalysisUncheckedUpdateManyWithoutTestFileNestedInput = {
    create?: XOR<TestAnalysisCreateWithoutTestFileInput, TestAnalysisUncheckedCreateWithoutTestFileInput> | TestAnalysisCreateWithoutTestFileInput[] | TestAnalysisUncheckedCreateWithoutTestFileInput[]
    connectOrCreate?: TestAnalysisCreateOrConnectWithoutTestFileInput | TestAnalysisCreateOrConnectWithoutTestFileInput[]
    upsert?: TestAnalysisUpsertWithWhereUniqueWithoutTestFileInput | TestAnalysisUpsertWithWhereUniqueWithoutTestFileInput[]
    createMany?: TestAnalysisCreateManyTestFileInputEnvelope
    set?: TestAnalysisWhereUniqueInput | TestAnalysisWhereUniqueInput[]
    disconnect?: TestAnalysisWhereUniqueInput | TestAnalysisWhereUniqueInput[]
    delete?: TestAnalysisWhereUniqueInput | TestAnalysisWhereUniqueInput[]
    connect?: TestAnalysisWhereUniqueInput | TestAnalysisWhereUniqueInput[]
    update?: TestAnalysisUpdateWithWhereUniqueWithoutTestFileInput | TestAnalysisUpdateWithWhereUniqueWithoutTestFileInput[]
    updateMany?: TestAnalysisUpdateManyWithWhereWithoutTestFileInput | TestAnalysisUpdateManyWithWhereWithoutTestFileInput[]
    deleteMany?: TestAnalysisScalarWhereInput | TestAnalysisScalarWhereInput[]
  }

  export type AnalysisSessionCreateNestedOneWithoutAnalysesInput = {
    create?: XOR<AnalysisSessionCreateWithoutAnalysesInput, AnalysisSessionUncheckedCreateWithoutAnalysesInput>
    connectOrCreate?: AnalysisSessionCreateOrConnectWithoutAnalysesInput
    connect?: AnalysisSessionWhereUniqueInput
  }

  export type TestFileCreateNestedOneWithoutAnalysesInput = {
    create?: XOR<TestFileCreateWithoutAnalysesInput, TestFileUncheckedCreateWithoutAnalysesInput>
    connectOrCreate?: TestFileCreateOrConnectWithoutAnalysesInput
    connect?: TestFileWhereUniqueInput
  }

  export type AnalysisSessionUpdateOneRequiredWithoutAnalysesNestedInput = {
    create?: XOR<AnalysisSessionCreateWithoutAnalysesInput, AnalysisSessionUncheckedCreateWithoutAnalysesInput>
    connectOrCreate?: AnalysisSessionCreateOrConnectWithoutAnalysesInput
    upsert?: AnalysisSessionUpsertWithoutAnalysesInput
    connect?: AnalysisSessionWhereUniqueInput
    update?: XOR<XOR<AnalysisSessionUpdateToOneWithWhereWithoutAnalysesInput, AnalysisSessionUpdateWithoutAnalysesInput>, AnalysisSessionUncheckedUpdateWithoutAnalysesInput>
  }

  export type TestFileUpdateOneRequiredWithoutAnalysesNestedInput = {
    create?: XOR<TestFileCreateWithoutAnalysesInput, TestFileUncheckedCreateWithoutAnalysesInput>
    connectOrCreate?: TestFileCreateOrConnectWithoutAnalysesInput
    upsert?: TestFileUpsertWithoutAnalysesInput
    connect?: TestFileWhereUniqueInput
    update?: XOR<XOR<TestFileUpdateToOneWithWhereWithoutAnalysesInput, TestFileUpdateWithoutAnalysesInput>, TestFileUncheckedUpdateWithoutAnalysesInput>
  }

  export type EnumPatternTypeFieldUpdateOperationsInput = {
    set?: $Enums.PatternType
  }

  export type TestFileCreateNestedOneWithoutExecutionsInput = {
    create?: XOR<TestFileCreateWithoutExecutionsInput, TestFileUncheckedCreateWithoutExecutionsInput>
    connectOrCreate?: TestFileCreateOrConnectWithoutExecutionsInput
    connect?: TestFileWhereUniqueInput
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type TestFileUpdateOneRequiredWithoutExecutionsNestedInput = {
    create?: XOR<TestFileCreateWithoutExecutionsInput, TestFileUncheckedCreateWithoutExecutionsInput>
    connectOrCreate?: TestFileCreateOrConnectWithoutExecutionsInput
    upsert?: TestFileUpsertWithoutExecutionsInput
    connect?: TestFileWhereUniqueInput
    update?: XOR<XOR<TestFileUpdateToOneWithWhereWithoutExecutionsInput, TestFileUpdateWithoutExecutionsInput>, TestFileUncheckedUpdateWithoutExecutionsInput>
  }

  export type TestFileCreateNestedOneWithoutCoverageInput = {
    create?: XOR<TestFileCreateWithoutCoverageInput, TestFileUncheckedCreateWithoutCoverageInput>
    connectOrCreate?: TestFileCreateOrConnectWithoutCoverageInput
    connect?: TestFileWhereUniqueInput
  }

  export type TestFileUpdateOneRequiredWithoutCoverageNestedInput = {
    create?: XOR<TestFileCreateWithoutCoverageInput, TestFileUncheckedCreateWithoutCoverageInput>
    connectOrCreate?: TestFileCreateOrConnectWithoutCoverageInput
    upsert?: TestFileUpsertWithoutCoverageInput
    connect?: TestFileWhereUniqueInput
    update?: XOR<XOR<TestFileUpdateToOneWithWhereWithoutCoverageInput, TestFileUpdateWithoutCoverageInput>, TestFileUncheckedUpdateWithoutCoverageInput>
  }

  export type TestFileCreateNestedOneWithoutFixesInput = {
    create?: XOR<TestFileCreateWithoutFixesInput, TestFileUncheckedCreateWithoutFixesInput>
    connectOrCreate?: TestFileCreateOrConnectWithoutFixesInput
    connect?: TestFileWhereUniqueInput
  }

  export type EnumFixTypeFieldUpdateOperationsInput = {
    set?: $Enums.FixType
  }

  export type TestFileUpdateOneRequiredWithoutFixesNestedInput = {
    create?: XOR<TestFileCreateWithoutFixesInput, TestFileUncheckedCreateWithoutFixesInput>
    connectOrCreate?: TestFileCreateOrConnectWithoutFixesInput
    upsert?: TestFileUpsertWithoutFixesInput
    connect?: TestFileWhereUniqueInput
    update?: XOR<XOR<TestFileUpdateToOneWithWhereWithoutFixesInput, TestFileUpdateWithoutFixesInput>, TestFileUncheckedUpdateWithoutFixesInput>
  }

  export type TestFileCreateNestedOneWithoutGenerationsInput = {
    create?: XOR<TestFileCreateWithoutGenerationsInput, TestFileUncheckedCreateWithoutGenerationsInput>
    connectOrCreate?: TestFileCreateOrConnectWithoutGenerationsInput
    connect?: TestFileWhereUniqueInput
  }

  export type EnumGenerationTypeFieldUpdateOperationsInput = {
    set?: $Enums.GenerationType
  }

  export type TestFileUpdateOneRequiredWithoutGenerationsNestedInput = {
    create?: XOR<TestFileCreateWithoutGenerationsInput, TestFileUncheckedCreateWithoutGenerationsInput>
    connectOrCreate?: TestFileCreateOrConnectWithoutGenerationsInput
    upsert?: TestFileUpsertWithoutGenerationsInput
    connect?: TestFileWhereUniqueInput
    update?: XOR<XOR<TestFileUpdateToOneWithWhereWithoutGenerationsInput, TestFileUpdateWithoutGenerationsInput>, TestFileUncheckedUpdateWithoutGenerationsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedEnumSessionStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SessionStatus | EnumSessionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SessionStatus[] | ListEnumSessionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SessionStatus[] | ListEnumSessionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSessionStatusFilter<$PrismaModel> | $Enums.SessionStatus
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumSessionStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SessionStatus | EnumSessionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SessionStatus[] | ListEnumSessionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SessionStatus[] | ListEnumSessionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSessionStatusWithAggregatesFilter<$PrismaModel> | $Enums.SessionStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSessionStatusFilter<$PrismaModel>
    _max?: NestedEnumSessionStatusFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedEnumTestHealthScoreFilter<$PrismaModel = never> = {
    equals?: $Enums.TestHealthScore | EnumTestHealthScoreFieldRefInput<$PrismaModel>
    in?: $Enums.TestHealthScore[] | ListEnumTestHealthScoreFieldRefInput<$PrismaModel>
    notIn?: $Enums.TestHealthScore[] | ListEnumTestHealthScoreFieldRefInput<$PrismaModel>
    not?: NestedEnumTestHealthScoreFilter<$PrismaModel> | $Enums.TestHealthScore
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type NestedEnumTestHealthScoreWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TestHealthScore | EnumTestHealthScoreFieldRefInput<$PrismaModel>
    in?: $Enums.TestHealthScore[] | ListEnumTestHealthScoreFieldRefInput<$PrismaModel>
    notIn?: $Enums.TestHealthScore[] | ListEnumTestHealthScoreFieldRefInput<$PrismaModel>
    not?: NestedEnumTestHealthScoreWithAggregatesFilter<$PrismaModel> | $Enums.TestHealthScore
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTestHealthScoreFilter<$PrismaModel>
    _max?: NestedEnumTestHealthScoreFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedEnumPatternTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.PatternType | EnumPatternTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PatternType[] | ListEnumPatternTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.PatternType[] | ListEnumPatternTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumPatternTypeFilter<$PrismaModel> | $Enums.PatternType
  }

  export type NestedEnumPatternTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PatternType | EnumPatternTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PatternType[] | ListEnumPatternTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.PatternType[] | ListEnumPatternTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumPatternTypeWithAggregatesFilter<$PrismaModel> | $Enums.PatternType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPatternTypeFilter<$PrismaModel>
    _max?: NestedEnumPatternTypeFilter<$PrismaModel>
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedEnumFixTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.FixType | EnumFixTypeFieldRefInput<$PrismaModel>
    in?: $Enums.FixType[] | ListEnumFixTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.FixType[] | ListEnumFixTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumFixTypeFilter<$PrismaModel> | $Enums.FixType
  }

  export type NestedEnumFixTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.FixType | EnumFixTypeFieldRefInput<$PrismaModel>
    in?: $Enums.FixType[] | ListEnumFixTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.FixType[] | ListEnumFixTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumFixTypeWithAggregatesFilter<$PrismaModel> | $Enums.FixType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumFixTypeFilter<$PrismaModel>
    _max?: NestedEnumFixTypeFilter<$PrismaModel>
  }

  export type NestedEnumGenerationTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.GenerationType | EnumGenerationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.GenerationType[] | ListEnumGenerationTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.GenerationType[] | ListEnumGenerationTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumGenerationTypeFilter<$PrismaModel> | $Enums.GenerationType
  }

  export type NestedEnumGenerationTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.GenerationType | EnumGenerationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.GenerationType[] | ListEnumGenerationTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.GenerationType[] | ListEnumGenerationTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumGenerationTypeWithAggregatesFilter<$PrismaModel> | $Enums.GenerationType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumGenerationTypeFilter<$PrismaModel>
    _max?: NestedEnumGenerationTypeFilter<$PrismaModel>
  }

  export type TestFileCreateWithoutSessionsInput = {
    id?: string
    filePath: string
    fileName: string
    firstSeen?: Date | string
    lastUpdated?: Date | string
    totalRuns?: number
    avgPassRate?: number
    currentPassRate?: number
    avgDuration?: number
    currentCoverage?: number
    avgCoverage?: number
    totalFixes?: number
    flakyTests?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: $Enums.TestHealthScore
    totalTests?: number
    criticalTests?: number
    lastFailureReason?: string | null
    executions?: TestExecutionCreateNestedManyWithoutTestFileInput
    coverage?: TestCoverageCreateNestedManyWithoutTestFileInput
    fixes?: TestFixCreateNestedManyWithoutTestFileInput
    generations?: TestGenerationCreateNestedManyWithoutTestFileInput
    analyses?: TestAnalysisCreateNestedManyWithoutTestFileInput
  }

  export type TestFileUncheckedCreateWithoutSessionsInput = {
    id?: string
    filePath: string
    fileName: string
    firstSeen?: Date | string
    lastUpdated?: Date | string
    totalRuns?: number
    avgPassRate?: number
    currentPassRate?: number
    avgDuration?: number
    currentCoverage?: number
    avgCoverage?: number
    totalFixes?: number
    flakyTests?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: $Enums.TestHealthScore
    totalTests?: number
    criticalTests?: number
    lastFailureReason?: string | null
    executions?: TestExecutionUncheckedCreateNestedManyWithoutTestFileInput
    coverage?: TestCoverageUncheckedCreateNestedManyWithoutTestFileInput
    fixes?: TestFixUncheckedCreateNestedManyWithoutTestFileInput
    generations?: TestGenerationUncheckedCreateNestedManyWithoutTestFileInput
    analyses?: TestAnalysisUncheckedCreateNestedManyWithoutTestFileInput
  }

  export type TestFileCreateOrConnectWithoutSessionsInput = {
    where: TestFileWhereUniqueInput
    create: XOR<TestFileCreateWithoutSessionsInput, TestFileUncheckedCreateWithoutSessionsInput>
  }

  export type TestAnalysisCreateWithoutSessionInput = {
    id?: string
    patterns: JsonNullValueInput | InputJsonValue
    antiPatterns: JsonNullValueInput | InputJsonValue
    suggestions: JsonNullValueInput | InputJsonValue
    context: JsonNullValueInput | InputJsonValue
    timestamp?: Date | string
    testFile: TestFileCreateNestedOneWithoutAnalysesInput
  }

  export type TestAnalysisUncheckedCreateWithoutSessionInput = {
    id?: string
    testFileId: string
    patterns: JsonNullValueInput | InputJsonValue
    antiPatterns: JsonNullValueInput | InputJsonValue
    suggestions: JsonNullValueInput | InputJsonValue
    context: JsonNullValueInput | InputJsonValue
    timestamp?: Date | string
  }

  export type TestAnalysisCreateOrConnectWithoutSessionInput = {
    where: TestAnalysisWhereUniqueInput
    create: XOR<TestAnalysisCreateWithoutSessionInput, TestAnalysisUncheckedCreateWithoutSessionInput>
  }

  export type TestAnalysisCreateManySessionInputEnvelope = {
    data: TestAnalysisCreateManySessionInput | TestAnalysisCreateManySessionInput[]
    skipDuplicates?: boolean
  }

  export type TestFileUpsertWithWhereUniqueWithoutSessionsInput = {
    where: TestFileWhereUniqueInput
    update: XOR<TestFileUpdateWithoutSessionsInput, TestFileUncheckedUpdateWithoutSessionsInput>
    create: XOR<TestFileCreateWithoutSessionsInput, TestFileUncheckedCreateWithoutSessionsInput>
  }

  export type TestFileUpdateWithWhereUniqueWithoutSessionsInput = {
    where: TestFileWhereUniqueInput
    data: XOR<TestFileUpdateWithoutSessionsInput, TestFileUncheckedUpdateWithoutSessionsInput>
  }

  export type TestFileUpdateManyWithWhereWithoutSessionsInput = {
    where: TestFileScalarWhereInput
    data: XOR<TestFileUpdateManyMutationInput, TestFileUncheckedUpdateManyWithoutSessionsInput>
  }

  export type TestFileScalarWhereInput = {
    AND?: TestFileScalarWhereInput | TestFileScalarWhereInput[]
    OR?: TestFileScalarWhereInput[]
    NOT?: TestFileScalarWhereInput | TestFileScalarWhereInput[]
    id?: StringFilter<"TestFile"> | string
    filePath?: StringFilter<"TestFile"> | string
    fileName?: StringFilter<"TestFile"> | string
    firstSeen?: DateTimeFilter<"TestFile"> | Date | string
    lastUpdated?: DateTimeFilter<"TestFile"> | Date | string
    totalRuns?: IntFilter<"TestFile"> | number
    avgPassRate?: FloatFilter<"TestFile"> | number
    currentPassRate?: FloatFilter<"TestFile"> | number
    avgDuration?: FloatFilter<"TestFile"> | number
    currentCoverage?: FloatFilter<"TestFile"> | number
    avgCoverage?: FloatFilter<"TestFile"> | number
    totalFixes?: IntFilter<"TestFile"> | number
    flakyTests?: IntFilter<"TestFile"> | number
    metadata?: JsonNullableFilter<"TestFile">
    healthScore?: EnumTestHealthScoreFilter<"TestFile"> | $Enums.TestHealthScore
    totalTests?: IntFilter<"TestFile"> | number
    criticalTests?: IntFilter<"TestFile"> | number
    lastFailureReason?: StringNullableFilter<"TestFile"> | string | null
  }

  export type TestAnalysisUpsertWithWhereUniqueWithoutSessionInput = {
    where: TestAnalysisWhereUniqueInput
    update: XOR<TestAnalysisUpdateWithoutSessionInput, TestAnalysisUncheckedUpdateWithoutSessionInput>
    create: XOR<TestAnalysisCreateWithoutSessionInput, TestAnalysisUncheckedCreateWithoutSessionInput>
  }

  export type TestAnalysisUpdateWithWhereUniqueWithoutSessionInput = {
    where: TestAnalysisWhereUniqueInput
    data: XOR<TestAnalysisUpdateWithoutSessionInput, TestAnalysisUncheckedUpdateWithoutSessionInput>
  }

  export type TestAnalysisUpdateManyWithWhereWithoutSessionInput = {
    where: TestAnalysisScalarWhereInput
    data: XOR<TestAnalysisUpdateManyMutationInput, TestAnalysisUncheckedUpdateManyWithoutSessionInput>
  }

  export type TestAnalysisScalarWhereInput = {
    AND?: TestAnalysisScalarWhereInput | TestAnalysisScalarWhereInput[]
    OR?: TestAnalysisScalarWhereInput[]
    NOT?: TestAnalysisScalarWhereInput | TestAnalysisScalarWhereInput[]
    id?: StringFilter<"TestAnalysis"> | string
    sessionId?: StringFilter<"TestAnalysis"> | string
    testFileId?: StringFilter<"TestAnalysis"> | string
    patterns?: JsonFilter<"TestAnalysis">
    antiPatterns?: JsonFilter<"TestAnalysis">
    suggestions?: JsonFilter<"TestAnalysis">
    context?: JsonFilter<"TestAnalysis">
    timestamp?: DateTimeFilter<"TestAnalysis"> | Date | string
  }

  export type AnalysisSessionCreateWithoutTestFilesInput = {
    id?: string
    startedAt?: Date | string
    endedAt?: Date | string | null
    status?: $Enums.SessionStatus
    context?: NullableJsonNullValueInput | InputJsonValue
    decisions?: AnalysisSessionCreatedecisionsInput | InputJsonValue[]
    operations?: AnalysisSessionCreateoperationsInput | InputJsonValue[]
    analyses?: TestAnalysisCreateNestedManyWithoutSessionInput
  }

  export type AnalysisSessionUncheckedCreateWithoutTestFilesInput = {
    id?: string
    startedAt?: Date | string
    endedAt?: Date | string | null
    status?: $Enums.SessionStatus
    context?: NullableJsonNullValueInput | InputJsonValue
    decisions?: AnalysisSessionCreatedecisionsInput | InputJsonValue[]
    operations?: AnalysisSessionCreateoperationsInput | InputJsonValue[]
    analyses?: TestAnalysisUncheckedCreateNestedManyWithoutSessionInput
  }

  export type AnalysisSessionCreateOrConnectWithoutTestFilesInput = {
    where: AnalysisSessionWhereUniqueInput
    create: XOR<AnalysisSessionCreateWithoutTestFilesInput, AnalysisSessionUncheckedCreateWithoutTestFilesInput>
  }

  export type TestExecutionCreateWithoutTestFileInput = {
    id?: string
    executedAt?: Date | string
    passed: boolean
    duration: number
    errorMessage?: string | null
    testResults: JsonNullValueInput | InputJsonValue
    environment: string
    commitHash?: string | null
    performance?: NullableJsonNullValueInput | InputJsonValue
  }

  export type TestExecutionUncheckedCreateWithoutTestFileInput = {
    id?: string
    executedAt?: Date | string
    passed: boolean
    duration: number
    errorMessage?: string | null
    testResults: JsonNullValueInput | InputJsonValue
    environment: string
    commitHash?: string | null
    performance?: NullableJsonNullValueInput | InputJsonValue
  }

  export type TestExecutionCreateOrConnectWithoutTestFileInput = {
    where: TestExecutionWhereUniqueInput
    create: XOR<TestExecutionCreateWithoutTestFileInput, TestExecutionUncheckedCreateWithoutTestFileInput>
  }

  export type TestExecutionCreateManyTestFileInputEnvelope = {
    data: TestExecutionCreateManyTestFileInput | TestExecutionCreateManyTestFileInput[]
    skipDuplicates?: boolean
  }

  export type TestCoverageCreateWithoutTestFileInput = {
    id?: string
    measuredAt?: Date | string
    coveragePercent: number
    linesCovered: JsonNullValueInput | InputJsonValue
    linesUncovered: JsonNullValueInput | InputJsonValue
    branchCoverage?: NullableJsonNullValueInput | InputJsonValue
    functionCoverage?: NullableJsonNullValueInput | InputJsonValue
    suggestedAreas?: NullableJsonNullValueInput | InputJsonValue
    coverageType: string
  }

  export type TestCoverageUncheckedCreateWithoutTestFileInput = {
    id?: string
    measuredAt?: Date | string
    coveragePercent: number
    linesCovered: JsonNullValueInput | InputJsonValue
    linesUncovered: JsonNullValueInput | InputJsonValue
    branchCoverage?: NullableJsonNullValueInput | InputJsonValue
    functionCoverage?: NullableJsonNullValueInput | InputJsonValue
    suggestedAreas?: NullableJsonNullValueInput | InputJsonValue
    coverageType: string
  }

  export type TestCoverageCreateOrConnectWithoutTestFileInput = {
    where: TestCoverageWhereUniqueInput
    create: XOR<TestCoverageCreateWithoutTestFileInput, TestCoverageUncheckedCreateWithoutTestFileInput>
  }

  export type TestCoverageCreateManyTestFileInputEnvelope = {
    data: TestCoverageCreateManyTestFileInput | TestCoverageCreateManyTestFileInput[]
    skipDuplicates?: boolean
  }

  export type TestFixCreateWithoutTestFileInput = {
    id?: string
    appliedAt?: Date | string
    fixType: $Enums.FixType
    problem: string
    solution: string
    successful: boolean
    confidenceScore: number
    beforeState: JsonNullValueInput | InputJsonValue
    afterState: JsonNullValueInput | InputJsonValue
    patternUsed?: string | null
    impactScore: number
  }

  export type TestFixUncheckedCreateWithoutTestFileInput = {
    id?: string
    appliedAt?: Date | string
    fixType: $Enums.FixType
    problem: string
    solution: string
    successful: boolean
    confidenceScore: number
    beforeState: JsonNullValueInput | InputJsonValue
    afterState: JsonNullValueInput | InputJsonValue
    patternUsed?: string | null
    impactScore: number
  }

  export type TestFixCreateOrConnectWithoutTestFileInput = {
    where: TestFixWhereUniqueInput
    create: XOR<TestFixCreateWithoutTestFileInput, TestFixUncheckedCreateWithoutTestFileInput>
  }

  export type TestFixCreateManyTestFileInputEnvelope = {
    data: TestFixCreateManyTestFileInput | TestFixCreateManyTestFileInput[]
    skipDuplicates?: boolean
  }

  export type TestGenerationCreateWithoutTestFileInput = {
    id?: string
    generatedAt?: Date | string
    generationType: $Enums.GenerationType
    newTests: JsonNullValueInput | InputJsonValue
    accepted: boolean
    targetArea: string
    coverageImprovement: number
    generationStrategy: string
    context: JsonNullValueInput | InputJsonValue
  }

  export type TestGenerationUncheckedCreateWithoutTestFileInput = {
    id?: string
    generatedAt?: Date | string
    generationType: $Enums.GenerationType
    newTests: JsonNullValueInput | InputJsonValue
    accepted: boolean
    targetArea: string
    coverageImprovement: number
    generationStrategy: string
    context: JsonNullValueInput | InputJsonValue
  }

  export type TestGenerationCreateOrConnectWithoutTestFileInput = {
    where: TestGenerationWhereUniqueInput
    create: XOR<TestGenerationCreateWithoutTestFileInput, TestGenerationUncheckedCreateWithoutTestFileInput>
  }

  export type TestGenerationCreateManyTestFileInputEnvelope = {
    data: TestGenerationCreateManyTestFileInput | TestGenerationCreateManyTestFileInput[]
    skipDuplicates?: boolean
  }

  export type TestAnalysisCreateWithoutTestFileInput = {
    id?: string
    patterns: JsonNullValueInput | InputJsonValue
    antiPatterns: JsonNullValueInput | InputJsonValue
    suggestions: JsonNullValueInput | InputJsonValue
    context: JsonNullValueInput | InputJsonValue
    timestamp?: Date | string
    session: AnalysisSessionCreateNestedOneWithoutAnalysesInput
  }

  export type TestAnalysisUncheckedCreateWithoutTestFileInput = {
    id?: string
    sessionId: string
    patterns: JsonNullValueInput | InputJsonValue
    antiPatterns: JsonNullValueInput | InputJsonValue
    suggestions: JsonNullValueInput | InputJsonValue
    context: JsonNullValueInput | InputJsonValue
    timestamp?: Date | string
  }

  export type TestAnalysisCreateOrConnectWithoutTestFileInput = {
    where: TestAnalysisWhereUniqueInput
    create: XOR<TestAnalysisCreateWithoutTestFileInput, TestAnalysisUncheckedCreateWithoutTestFileInput>
  }

  export type TestAnalysisCreateManyTestFileInputEnvelope = {
    data: TestAnalysisCreateManyTestFileInput | TestAnalysisCreateManyTestFileInput[]
    skipDuplicates?: boolean
  }

  export type AnalysisSessionUpsertWithWhereUniqueWithoutTestFilesInput = {
    where: AnalysisSessionWhereUniqueInput
    update: XOR<AnalysisSessionUpdateWithoutTestFilesInput, AnalysisSessionUncheckedUpdateWithoutTestFilesInput>
    create: XOR<AnalysisSessionCreateWithoutTestFilesInput, AnalysisSessionUncheckedCreateWithoutTestFilesInput>
  }

  export type AnalysisSessionUpdateWithWhereUniqueWithoutTestFilesInput = {
    where: AnalysisSessionWhereUniqueInput
    data: XOR<AnalysisSessionUpdateWithoutTestFilesInput, AnalysisSessionUncheckedUpdateWithoutTestFilesInput>
  }

  export type AnalysisSessionUpdateManyWithWhereWithoutTestFilesInput = {
    where: AnalysisSessionScalarWhereInput
    data: XOR<AnalysisSessionUpdateManyMutationInput, AnalysisSessionUncheckedUpdateManyWithoutTestFilesInput>
  }

  export type AnalysisSessionScalarWhereInput = {
    AND?: AnalysisSessionScalarWhereInput | AnalysisSessionScalarWhereInput[]
    OR?: AnalysisSessionScalarWhereInput[]
    NOT?: AnalysisSessionScalarWhereInput | AnalysisSessionScalarWhereInput[]
    id?: StringFilter<"AnalysisSession"> | string
    startedAt?: DateTimeFilter<"AnalysisSession"> | Date | string
    endedAt?: DateTimeNullableFilter<"AnalysisSession"> | Date | string | null
    status?: EnumSessionStatusFilter<"AnalysisSession"> | $Enums.SessionStatus
    context?: JsonNullableFilter<"AnalysisSession">
    decisions?: JsonNullableListFilter<"AnalysisSession">
    operations?: JsonNullableListFilter<"AnalysisSession">
  }

  export type TestExecutionUpsertWithWhereUniqueWithoutTestFileInput = {
    where: TestExecutionWhereUniqueInput
    update: XOR<TestExecutionUpdateWithoutTestFileInput, TestExecutionUncheckedUpdateWithoutTestFileInput>
    create: XOR<TestExecutionCreateWithoutTestFileInput, TestExecutionUncheckedCreateWithoutTestFileInput>
  }

  export type TestExecutionUpdateWithWhereUniqueWithoutTestFileInput = {
    where: TestExecutionWhereUniqueInput
    data: XOR<TestExecutionUpdateWithoutTestFileInput, TestExecutionUncheckedUpdateWithoutTestFileInput>
  }

  export type TestExecutionUpdateManyWithWhereWithoutTestFileInput = {
    where: TestExecutionScalarWhereInput
    data: XOR<TestExecutionUpdateManyMutationInput, TestExecutionUncheckedUpdateManyWithoutTestFileInput>
  }

  export type TestExecutionScalarWhereInput = {
    AND?: TestExecutionScalarWhereInput | TestExecutionScalarWhereInput[]
    OR?: TestExecutionScalarWhereInput[]
    NOT?: TestExecutionScalarWhereInput | TestExecutionScalarWhereInput[]
    id?: StringFilter<"TestExecution"> | string
    testFileId?: StringFilter<"TestExecution"> | string
    executedAt?: DateTimeFilter<"TestExecution"> | Date | string
    passed?: BoolFilter<"TestExecution"> | boolean
    duration?: FloatFilter<"TestExecution"> | number
    errorMessage?: StringNullableFilter<"TestExecution"> | string | null
    testResults?: JsonFilter<"TestExecution">
    environment?: StringFilter<"TestExecution"> | string
    commitHash?: StringNullableFilter<"TestExecution"> | string | null
    performance?: JsonNullableFilter<"TestExecution">
  }

  export type TestCoverageUpsertWithWhereUniqueWithoutTestFileInput = {
    where: TestCoverageWhereUniqueInput
    update: XOR<TestCoverageUpdateWithoutTestFileInput, TestCoverageUncheckedUpdateWithoutTestFileInput>
    create: XOR<TestCoverageCreateWithoutTestFileInput, TestCoverageUncheckedCreateWithoutTestFileInput>
  }

  export type TestCoverageUpdateWithWhereUniqueWithoutTestFileInput = {
    where: TestCoverageWhereUniqueInput
    data: XOR<TestCoverageUpdateWithoutTestFileInput, TestCoverageUncheckedUpdateWithoutTestFileInput>
  }

  export type TestCoverageUpdateManyWithWhereWithoutTestFileInput = {
    where: TestCoverageScalarWhereInput
    data: XOR<TestCoverageUpdateManyMutationInput, TestCoverageUncheckedUpdateManyWithoutTestFileInput>
  }

  export type TestCoverageScalarWhereInput = {
    AND?: TestCoverageScalarWhereInput | TestCoverageScalarWhereInput[]
    OR?: TestCoverageScalarWhereInput[]
    NOT?: TestCoverageScalarWhereInput | TestCoverageScalarWhereInput[]
    id?: StringFilter<"TestCoverage"> | string
    testFileId?: StringFilter<"TestCoverage"> | string
    measuredAt?: DateTimeFilter<"TestCoverage"> | Date | string
    coveragePercent?: FloatFilter<"TestCoverage"> | number
    linesCovered?: JsonFilter<"TestCoverage">
    linesUncovered?: JsonFilter<"TestCoverage">
    branchCoverage?: JsonNullableFilter<"TestCoverage">
    functionCoverage?: JsonNullableFilter<"TestCoverage">
    suggestedAreas?: JsonNullableFilter<"TestCoverage">
    coverageType?: StringFilter<"TestCoverage"> | string
  }

  export type TestFixUpsertWithWhereUniqueWithoutTestFileInput = {
    where: TestFixWhereUniqueInput
    update: XOR<TestFixUpdateWithoutTestFileInput, TestFixUncheckedUpdateWithoutTestFileInput>
    create: XOR<TestFixCreateWithoutTestFileInput, TestFixUncheckedCreateWithoutTestFileInput>
  }

  export type TestFixUpdateWithWhereUniqueWithoutTestFileInput = {
    where: TestFixWhereUniqueInput
    data: XOR<TestFixUpdateWithoutTestFileInput, TestFixUncheckedUpdateWithoutTestFileInput>
  }

  export type TestFixUpdateManyWithWhereWithoutTestFileInput = {
    where: TestFixScalarWhereInput
    data: XOR<TestFixUpdateManyMutationInput, TestFixUncheckedUpdateManyWithoutTestFileInput>
  }

  export type TestFixScalarWhereInput = {
    AND?: TestFixScalarWhereInput | TestFixScalarWhereInput[]
    OR?: TestFixScalarWhereInput[]
    NOT?: TestFixScalarWhereInput | TestFixScalarWhereInput[]
    id?: StringFilter<"TestFix"> | string
    testFileId?: StringFilter<"TestFix"> | string
    appliedAt?: DateTimeFilter<"TestFix"> | Date | string
    fixType?: EnumFixTypeFilter<"TestFix"> | $Enums.FixType
    problem?: StringFilter<"TestFix"> | string
    solution?: StringFilter<"TestFix"> | string
    successful?: BoolFilter<"TestFix"> | boolean
    confidenceScore?: FloatFilter<"TestFix"> | number
    beforeState?: JsonFilter<"TestFix">
    afterState?: JsonFilter<"TestFix">
    patternUsed?: StringNullableFilter<"TestFix"> | string | null
    impactScore?: FloatFilter<"TestFix"> | number
  }

  export type TestGenerationUpsertWithWhereUniqueWithoutTestFileInput = {
    where: TestGenerationWhereUniqueInput
    update: XOR<TestGenerationUpdateWithoutTestFileInput, TestGenerationUncheckedUpdateWithoutTestFileInput>
    create: XOR<TestGenerationCreateWithoutTestFileInput, TestGenerationUncheckedCreateWithoutTestFileInput>
  }

  export type TestGenerationUpdateWithWhereUniqueWithoutTestFileInput = {
    where: TestGenerationWhereUniqueInput
    data: XOR<TestGenerationUpdateWithoutTestFileInput, TestGenerationUncheckedUpdateWithoutTestFileInput>
  }

  export type TestGenerationUpdateManyWithWhereWithoutTestFileInput = {
    where: TestGenerationScalarWhereInput
    data: XOR<TestGenerationUpdateManyMutationInput, TestGenerationUncheckedUpdateManyWithoutTestFileInput>
  }

  export type TestGenerationScalarWhereInput = {
    AND?: TestGenerationScalarWhereInput | TestGenerationScalarWhereInput[]
    OR?: TestGenerationScalarWhereInput[]
    NOT?: TestGenerationScalarWhereInput | TestGenerationScalarWhereInput[]
    id?: StringFilter<"TestGeneration"> | string
    testFileId?: StringFilter<"TestGeneration"> | string
    generatedAt?: DateTimeFilter<"TestGeneration"> | Date | string
    generationType?: EnumGenerationTypeFilter<"TestGeneration"> | $Enums.GenerationType
    newTests?: JsonFilter<"TestGeneration">
    accepted?: BoolFilter<"TestGeneration"> | boolean
    targetArea?: StringFilter<"TestGeneration"> | string
    coverageImprovement?: FloatFilter<"TestGeneration"> | number
    generationStrategy?: StringFilter<"TestGeneration"> | string
    context?: JsonFilter<"TestGeneration">
  }

  export type TestAnalysisUpsertWithWhereUniqueWithoutTestFileInput = {
    where: TestAnalysisWhereUniqueInput
    update: XOR<TestAnalysisUpdateWithoutTestFileInput, TestAnalysisUncheckedUpdateWithoutTestFileInput>
    create: XOR<TestAnalysisCreateWithoutTestFileInput, TestAnalysisUncheckedCreateWithoutTestFileInput>
  }

  export type TestAnalysisUpdateWithWhereUniqueWithoutTestFileInput = {
    where: TestAnalysisWhereUniqueInput
    data: XOR<TestAnalysisUpdateWithoutTestFileInput, TestAnalysisUncheckedUpdateWithoutTestFileInput>
  }

  export type TestAnalysisUpdateManyWithWhereWithoutTestFileInput = {
    where: TestAnalysisScalarWhereInput
    data: XOR<TestAnalysisUpdateManyMutationInput, TestAnalysisUncheckedUpdateManyWithoutTestFileInput>
  }

  export type AnalysisSessionCreateWithoutAnalysesInput = {
    id?: string
    startedAt?: Date | string
    endedAt?: Date | string | null
    status?: $Enums.SessionStatus
    context?: NullableJsonNullValueInput | InputJsonValue
    decisions?: AnalysisSessionCreatedecisionsInput | InputJsonValue[]
    operations?: AnalysisSessionCreateoperationsInput | InputJsonValue[]
    testFiles?: TestFileCreateNestedManyWithoutSessionsInput
  }

  export type AnalysisSessionUncheckedCreateWithoutAnalysesInput = {
    id?: string
    startedAt?: Date | string
    endedAt?: Date | string | null
    status?: $Enums.SessionStatus
    context?: NullableJsonNullValueInput | InputJsonValue
    decisions?: AnalysisSessionCreatedecisionsInput | InputJsonValue[]
    operations?: AnalysisSessionCreateoperationsInput | InputJsonValue[]
    testFiles?: TestFileUncheckedCreateNestedManyWithoutSessionsInput
  }

  export type AnalysisSessionCreateOrConnectWithoutAnalysesInput = {
    where: AnalysisSessionWhereUniqueInput
    create: XOR<AnalysisSessionCreateWithoutAnalysesInput, AnalysisSessionUncheckedCreateWithoutAnalysesInput>
  }

  export type TestFileCreateWithoutAnalysesInput = {
    id?: string
    filePath: string
    fileName: string
    firstSeen?: Date | string
    lastUpdated?: Date | string
    totalRuns?: number
    avgPassRate?: number
    currentPassRate?: number
    avgDuration?: number
    currentCoverage?: number
    avgCoverage?: number
    totalFixes?: number
    flakyTests?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: $Enums.TestHealthScore
    totalTests?: number
    criticalTests?: number
    lastFailureReason?: string | null
    sessions?: AnalysisSessionCreateNestedManyWithoutTestFilesInput
    executions?: TestExecutionCreateNestedManyWithoutTestFileInput
    coverage?: TestCoverageCreateNestedManyWithoutTestFileInput
    fixes?: TestFixCreateNestedManyWithoutTestFileInput
    generations?: TestGenerationCreateNestedManyWithoutTestFileInput
  }

  export type TestFileUncheckedCreateWithoutAnalysesInput = {
    id?: string
    filePath: string
    fileName: string
    firstSeen?: Date | string
    lastUpdated?: Date | string
    totalRuns?: number
    avgPassRate?: number
    currentPassRate?: number
    avgDuration?: number
    currentCoverage?: number
    avgCoverage?: number
    totalFixes?: number
    flakyTests?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: $Enums.TestHealthScore
    totalTests?: number
    criticalTests?: number
    lastFailureReason?: string | null
    sessions?: AnalysisSessionUncheckedCreateNestedManyWithoutTestFilesInput
    executions?: TestExecutionUncheckedCreateNestedManyWithoutTestFileInput
    coverage?: TestCoverageUncheckedCreateNestedManyWithoutTestFileInput
    fixes?: TestFixUncheckedCreateNestedManyWithoutTestFileInput
    generations?: TestGenerationUncheckedCreateNestedManyWithoutTestFileInput
  }

  export type TestFileCreateOrConnectWithoutAnalysesInput = {
    where: TestFileWhereUniqueInput
    create: XOR<TestFileCreateWithoutAnalysesInput, TestFileUncheckedCreateWithoutAnalysesInput>
  }

  export type AnalysisSessionUpsertWithoutAnalysesInput = {
    update: XOR<AnalysisSessionUpdateWithoutAnalysesInput, AnalysisSessionUncheckedUpdateWithoutAnalysesInput>
    create: XOR<AnalysisSessionCreateWithoutAnalysesInput, AnalysisSessionUncheckedCreateWithoutAnalysesInput>
    where?: AnalysisSessionWhereInput
  }

  export type AnalysisSessionUpdateToOneWithWhereWithoutAnalysesInput = {
    where?: AnalysisSessionWhereInput
    data: XOR<AnalysisSessionUpdateWithoutAnalysesInput, AnalysisSessionUncheckedUpdateWithoutAnalysesInput>
  }

  export type AnalysisSessionUpdateWithoutAnalysesInput = {
    id?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumSessionStatusFieldUpdateOperationsInput | $Enums.SessionStatus
    context?: NullableJsonNullValueInput | InputJsonValue
    decisions?: AnalysisSessionUpdatedecisionsInput | InputJsonValue[]
    operations?: AnalysisSessionUpdateoperationsInput | InputJsonValue[]
    testFiles?: TestFileUpdateManyWithoutSessionsNestedInput
  }

  export type AnalysisSessionUncheckedUpdateWithoutAnalysesInput = {
    id?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumSessionStatusFieldUpdateOperationsInput | $Enums.SessionStatus
    context?: NullableJsonNullValueInput | InputJsonValue
    decisions?: AnalysisSessionUpdatedecisionsInput | InputJsonValue[]
    operations?: AnalysisSessionUpdateoperationsInput | InputJsonValue[]
    testFiles?: TestFileUncheckedUpdateManyWithoutSessionsNestedInput
  }

  export type TestFileUpsertWithoutAnalysesInput = {
    update: XOR<TestFileUpdateWithoutAnalysesInput, TestFileUncheckedUpdateWithoutAnalysesInput>
    create: XOR<TestFileCreateWithoutAnalysesInput, TestFileUncheckedCreateWithoutAnalysesInput>
    where?: TestFileWhereInput
  }

  export type TestFileUpdateToOneWithWhereWithoutAnalysesInput = {
    where?: TestFileWhereInput
    data: XOR<TestFileUpdateWithoutAnalysesInput, TestFileUncheckedUpdateWithoutAnalysesInput>
  }

  export type TestFileUpdateWithoutAnalysesInput = {
    id?: StringFieldUpdateOperationsInput | string
    filePath?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    totalRuns?: IntFieldUpdateOperationsInput | number
    avgPassRate?: FloatFieldUpdateOperationsInput | number
    currentPassRate?: FloatFieldUpdateOperationsInput | number
    avgDuration?: FloatFieldUpdateOperationsInput | number
    currentCoverage?: FloatFieldUpdateOperationsInput | number
    avgCoverage?: FloatFieldUpdateOperationsInput | number
    totalFixes?: IntFieldUpdateOperationsInput | number
    flakyTests?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: EnumTestHealthScoreFieldUpdateOperationsInput | $Enums.TestHealthScore
    totalTests?: IntFieldUpdateOperationsInput | number
    criticalTests?: IntFieldUpdateOperationsInput | number
    lastFailureReason?: NullableStringFieldUpdateOperationsInput | string | null
    sessions?: AnalysisSessionUpdateManyWithoutTestFilesNestedInput
    executions?: TestExecutionUpdateManyWithoutTestFileNestedInput
    coverage?: TestCoverageUpdateManyWithoutTestFileNestedInput
    fixes?: TestFixUpdateManyWithoutTestFileNestedInput
    generations?: TestGenerationUpdateManyWithoutTestFileNestedInput
  }

  export type TestFileUncheckedUpdateWithoutAnalysesInput = {
    id?: StringFieldUpdateOperationsInput | string
    filePath?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    totalRuns?: IntFieldUpdateOperationsInput | number
    avgPassRate?: FloatFieldUpdateOperationsInput | number
    currentPassRate?: FloatFieldUpdateOperationsInput | number
    avgDuration?: FloatFieldUpdateOperationsInput | number
    currentCoverage?: FloatFieldUpdateOperationsInput | number
    avgCoverage?: FloatFieldUpdateOperationsInput | number
    totalFixes?: IntFieldUpdateOperationsInput | number
    flakyTests?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: EnumTestHealthScoreFieldUpdateOperationsInput | $Enums.TestHealthScore
    totalTests?: IntFieldUpdateOperationsInput | number
    criticalTests?: IntFieldUpdateOperationsInput | number
    lastFailureReason?: NullableStringFieldUpdateOperationsInput | string | null
    sessions?: AnalysisSessionUncheckedUpdateManyWithoutTestFilesNestedInput
    executions?: TestExecutionUncheckedUpdateManyWithoutTestFileNestedInput
    coverage?: TestCoverageUncheckedUpdateManyWithoutTestFileNestedInput
    fixes?: TestFixUncheckedUpdateManyWithoutTestFileNestedInput
    generations?: TestGenerationUncheckedUpdateManyWithoutTestFileNestedInput
  }

  export type TestFileCreateWithoutExecutionsInput = {
    id?: string
    filePath: string
    fileName: string
    firstSeen?: Date | string
    lastUpdated?: Date | string
    totalRuns?: number
    avgPassRate?: number
    currentPassRate?: number
    avgDuration?: number
    currentCoverage?: number
    avgCoverage?: number
    totalFixes?: number
    flakyTests?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: $Enums.TestHealthScore
    totalTests?: number
    criticalTests?: number
    lastFailureReason?: string | null
    sessions?: AnalysisSessionCreateNestedManyWithoutTestFilesInput
    coverage?: TestCoverageCreateNestedManyWithoutTestFileInput
    fixes?: TestFixCreateNestedManyWithoutTestFileInput
    generations?: TestGenerationCreateNestedManyWithoutTestFileInput
    analyses?: TestAnalysisCreateNestedManyWithoutTestFileInput
  }

  export type TestFileUncheckedCreateWithoutExecutionsInput = {
    id?: string
    filePath: string
    fileName: string
    firstSeen?: Date | string
    lastUpdated?: Date | string
    totalRuns?: number
    avgPassRate?: number
    currentPassRate?: number
    avgDuration?: number
    currentCoverage?: number
    avgCoverage?: number
    totalFixes?: number
    flakyTests?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: $Enums.TestHealthScore
    totalTests?: number
    criticalTests?: number
    lastFailureReason?: string | null
    sessions?: AnalysisSessionUncheckedCreateNestedManyWithoutTestFilesInput
    coverage?: TestCoverageUncheckedCreateNestedManyWithoutTestFileInput
    fixes?: TestFixUncheckedCreateNestedManyWithoutTestFileInput
    generations?: TestGenerationUncheckedCreateNestedManyWithoutTestFileInput
    analyses?: TestAnalysisUncheckedCreateNestedManyWithoutTestFileInput
  }

  export type TestFileCreateOrConnectWithoutExecutionsInput = {
    where: TestFileWhereUniqueInput
    create: XOR<TestFileCreateWithoutExecutionsInput, TestFileUncheckedCreateWithoutExecutionsInput>
  }

  export type TestFileUpsertWithoutExecutionsInput = {
    update: XOR<TestFileUpdateWithoutExecutionsInput, TestFileUncheckedUpdateWithoutExecutionsInput>
    create: XOR<TestFileCreateWithoutExecutionsInput, TestFileUncheckedCreateWithoutExecutionsInput>
    where?: TestFileWhereInput
  }

  export type TestFileUpdateToOneWithWhereWithoutExecutionsInput = {
    where?: TestFileWhereInput
    data: XOR<TestFileUpdateWithoutExecutionsInput, TestFileUncheckedUpdateWithoutExecutionsInput>
  }

  export type TestFileUpdateWithoutExecutionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    filePath?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    totalRuns?: IntFieldUpdateOperationsInput | number
    avgPassRate?: FloatFieldUpdateOperationsInput | number
    currentPassRate?: FloatFieldUpdateOperationsInput | number
    avgDuration?: FloatFieldUpdateOperationsInput | number
    currentCoverage?: FloatFieldUpdateOperationsInput | number
    avgCoverage?: FloatFieldUpdateOperationsInput | number
    totalFixes?: IntFieldUpdateOperationsInput | number
    flakyTests?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: EnumTestHealthScoreFieldUpdateOperationsInput | $Enums.TestHealthScore
    totalTests?: IntFieldUpdateOperationsInput | number
    criticalTests?: IntFieldUpdateOperationsInput | number
    lastFailureReason?: NullableStringFieldUpdateOperationsInput | string | null
    sessions?: AnalysisSessionUpdateManyWithoutTestFilesNestedInput
    coverage?: TestCoverageUpdateManyWithoutTestFileNestedInput
    fixes?: TestFixUpdateManyWithoutTestFileNestedInput
    generations?: TestGenerationUpdateManyWithoutTestFileNestedInput
    analyses?: TestAnalysisUpdateManyWithoutTestFileNestedInput
  }

  export type TestFileUncheckedUpdateWithoutExecutionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    filePath?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    totalRuns?: IntFieldUpdateOperationsInput | number
    avgPassRate?: FloatFieldUpdateOperationsInput | number
    currentPassRate?: FloatFieldUpdateOperationsInput | number
    avgDuration?: FloatFieldUpdateOperationsInput | number
    currentCoverage?: FloatFieldUpdateOperationsInput | number
    avgCoverage?: FloatFieldUpdateOperationsInput | number
    totalFixes?: IntFieldUpdateOperationsInput | number
    flakyTests?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: EnumTestHealthScoreFieldUpdateOperationsInput | $Enums.TestHealthScore
    totalTests?: IntFieldUpdateOperationsInput | number
    criticalTests?: IntFieldUpdateOperationsInput | number
    lastFailureReason?: NullableStringFieldUpdateOperationsInput | string | null
    sessions?: AnalysisSessionUncheckedUpdateManyWithoutTestFilesNestedInput
    coverage?: TestCoverageUncheckedUpdateManyWithoutTestFileNestedInput
    fixes?: TestFixUncheckedUpdateManyWithoutTestFileNestedInput
    generations?: TestGenerationUncheckedUpdateManyWithoutTestFileNestedInput
    analyses?: TestAnalysisUncheckedUpdateManyWithoutTestFileNestedInput
  }

  export type TestFileCreateWithoutCoverageInput = {
    id?: string
    filePath: string
    fileName: string
    firstSeen?: Date | string
    lastUpdated?: Date | string
    totalRuns?: number
    avgPassRate?: number
    currentPassRate?: number
    avgDuration?: number
    currentCoverage?: number
    avgCoverage?: number
    totalFixes?: number
    flakyTests?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: $Enums.TestHealthScore
    totalTests?: number
    criticalTests?: number
    lastFailureReason?: string | null
    sessions?: AnalysisSessionCreateNestedManyWithoutTestFilesInput
    executions?: TestExecutionCreateNestedManyWithoutTestFileInput
    fixes?: TestFixCreateNestedManyWithoutTestFileInput
    generations?: TestGenerationCreateNestedManyWithoutTestFileInput
    analyses?: TestAnalysisCreateNestedManyWithoutTestFileInput
  }

  export type TestFileUncheckedCreateWithoutCoverageInput = {
    id?: string
    filePath: string
    fileName: string
    firstSeen?: Date | string
    lastUpdated?: Date | string
    totalRuns?: number
    avgPassRate?: number
    currentPassRate?: number
    avgDuration?: number
    currentCoverage?: number
    avgCoverage?: number
    totalFixes?: number
    flakyTests?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: $Enums.TestHealthScore
    totalTests?: number
    criticalTests?: number
    lastFailureReason?: string | null
    sessions?: AnalysisSessionUncheckedCreateNestedManyWithoutTestFilesInput
    executions?: TestExecutionUncheckedCreateNestedManyWithoutTestFileInput
    fixes?: TestFixUncheckedCreateNestedManyWithoutTestFileInput
    generations?: TestGenerationUncheckedCreateNestedManyWithoutTestFileInput
    analyses?: TestAnalysisUncheckedCreateNestedManyWithoutTestFileInput
  }

  export type TestFileCreateOrConnectWithoutCoverageInput = {
    where: TestFileWhereUniqueInput
    create: XOR<TestFileCreateWithoutCoverageInput, TestFileUncheckedCreateWithoutCoverageInput>
  }

  export type TestFileUpsertWithoutCoverageInput = {
    update: XOR<TestFileUpdateWithoutCoverageInput, TestFileUncheckedUpdateWithoutCoverageInput>
    create: XOR<TestFileCreateWithoutCoverageInput, TestFileUncheckedCreateWithoutCoverageInput>
    where?: TestFileWhereInput
  }

  export type TestFileUpdateToOneWithWhereWithoutCoverageInput = {
    where?: TestFileWhereInput
    data: XOR<TestFileUpdateWithoutCoverageInput, TestFileUncheckedUpdateWithoutCoverageInput>
  }

  export type TestFileUpdateWithoutCoverageInput = {
    id?: StringFieldUpdateOperationsInput | string
    filePath?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    totalRuns?: IntFieldUpdateOperationsInput | number
    avgPassRate?: FloatFieldUpdateOperationsInput | number
    currentPassRate?: FloatFieldUpdateOperationsInput | number
    avgDuration?: FloatFieldUpdateOperationsInput | number
    currentCoverage?: FloatFieldUpdateOperationsInput | number
    avgCoverage?: FloatFieldUpdateOperationsInput | number
    totalFixes?: IntFieldUpdateOperationsInput | number
    flakyTests?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: EnumTestHealthScoreFieldUpdateOperationsInput | $Enums.TestHealthScore
    totalTests?: IntFieldUpdateOperationsInput | number
    criticalTests?: IntFieldUpdateOperationsInput | number
    lastFailureReason?: NullableStringFieldUpdateOperationsInput | string | null
    sessions?: AnalysisSessionUpdateManyWithoutTestFilesNestedInput
    executions?: TestExecutionUpdateManyWithoutTestFileNestedInput
    fixes?: TestFixUpdateManyWithoutTestFileNestedInput
    generations?: TestGenerationUpdateManyWithoutTestFileNestedInput
    analyses?: TestAnalysisUpdateManyWithoutTestFileNestedInput
  }

  export type TestFileUncheckedUpdateWithoutCoverageInput = {
    id?: StringFieldUpdateOperationsInput | string
    filePath?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    totalRuns?: IntFieldUpdateOperationsInput | number
    avgPassRate?: FloatFieldUpdateOperationsInput | number
    currentPassRate?: FloatFieldUpdateOperationsInput | number
    avgDuration?: FloatFieldUpdateOperationsInput | number
    currentCoverage?: FloatFieldUpdateOperationsInput | number
    avgCoverage?: FloatFieldUpdateOperationsInput | number
    totalFixes?: IntFieldUpdateOperationsInput | number
    flakyTests?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: EnumTestHealthScoreFieldUpdateOperationsInput | $Enums.TestHealthScore
    totalTests?: IntFieldUpdateOperationsInput | number
    criticalTests?: IntFieldUpdateOperationsInput | number
    lastFailureReason?: NullableStringFieldUpdateOperationsInput | string | null
    sessions?: AnalysisSessionUncheckedUpdateManyWithoutTestFilesNestedInput
    executions?: TestExecutionUncheckedUpdateManyWithoutTestFileNestedInput
    fixes?: TestFixUncheckedUpdateManyWithoutTestFileNestedInput
    generations?: TestGenerationUncheckedUpdateManyWithoutTestFileNestedInput
    analyses?: TestAnalysisUncheckedUpdateManyWithoutTestFileNestedInput
  }

  export type TestFileCreateWithoutFixesInput = {
    id?: string
    filePath: string
    fileName: string
    firstSeen?: Date | string
    lastUpdated?: Date | string
    totalRuns?: number
    avgPassRate?: number
    currentPassRate?: number
    avgDuration?: number
    currentCoverage?: number
    avgCoverage?: number
    totalFixes?: number
    flakyTests?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: $Enums.TestHealthScore
    totalTests?: number
    criticalTests?: number
    lastFailureReason?: string | null
    sessions?: AnalysisSessionCreateNestedManyWithoutTestFilesInput
    executions?: TestExecutionCreateNestedManyWithoutTestFileInput
    coverage?: TestCoverageCreateNestedManyWithoutTestFileInput
    generations?: TestGenerationCreateNestedManyWithoutTestFileInput
    analyses?: TestAnalysisCreateNestedManyWithoutTestFileInput
  }

  export type TestFileUncheckedCreateWithoutFixesInput = {
    id?: string
    filePath: string
    fileName: string
    firstSeen?: Date | string
    lastUpdated?: Date | string
    totalRuns?: number
    avgPassRate?: number
    currentPassRate?: number
    avgDuration?: number
    currentCoverage?: number
    avgCoverage?: number
    totalFixes?: number
    flakyTests?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: $Enums.TestHealthScore
    totalTests?: number
    criticalTests?: number
    lastFailureReason?: string | null
    sessions?: AnalysisSessionUncheckedCreateNestedManyWithoutTestFilesInput
    executions?: TestExecutionUncheckedCreateNestedManyWithoutTestFileInput
    coverage?: TestCoverageUncheckedCreateNestedManyWithoutTestFileInput
    generations?: TestGenerationUncheckedCreateNestedManyWithoutTestFileInput
    analyses?: TestAnalysisUncheckedCreateNestedManyWithoutTestFileInput
  }

  export type TestFileCreateOrConnectWithoutFixesInput = {
    where: TestFileWhereUniqueInput
    create: XOR<TestFileCreateWithoutFixesInput, TestFileUncheckedCreateWithoutFixesInput>
  }

  export type TestFileUpsertWithoutFixesInput = {
    update: XOR<TestFileUpdateWithoutFixesInput, TestFileUncheckedUpdateWithoutFixesInput>
    create: XOR<TestFileCreateWithoutFixesInput, TestFileUncheckedCreateWithoutFixesInput>
    where?: TestFileWhereInput
  }

  export type TestFileUpdateToOneWithWhereWithoutFixesInput = {
    where?: TestFileWhereInput
    data: XOR<TestFileUpdateWithoutFixesInput, TestFileUncheckedUpdateWithoutFixesInput>
  }

  export type TestFileUpdateWithoutFixesInput = {
    id?: StringFieldUpdateOperationsInput | string
    filePath?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    totalRuns?: IntFieldUpdateOperationsInput | number
    avgPassRate?: FloatFieldUpdateOperationsInput | number
    currentPassRate?: FloatFieldUpdateOperationsInput | number
    avgDuration?: FloatFieldUpdateOperationsInput | number
    currentCoverage?: FloatFieldUpdateOperationsInput | number
    avgCoverage?: FloatFieldUpdateOperationsInput | number
    totalFixes?: IntFieldUpdateOperationsInput | number
    flakyTests?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: EnumTestHealthScoreFieldUpdateOperationsInput | $Enums.TestHealthScore
    totalTests?: IntFieldUpdateOperationsInput | number
    criticalTests?: IntFieldUpdateOperationsInput | number
    lastFailureReason?: NullableStringFieldUpdateOperationsInput | string | null
    sessions?: AnalysisSessionUpdateManyWithoutTestFilesNestedInput
    executions?: TestExecutionUpdateManyWithoutTestFileNestedInput
    coverage?: TestCoverageUpdateManyWithoutTestFileNestedInput
    generations?: TestGenerationUpdateManyWithoutTestFileNestedInput
    analyses?: TestAnalysisUpdateManyWithoutTestFileNestedInput
  }

  export type TestFileUncheckedUpdateWithoutFixesInput = {
    id?: StringFieldUpdateOperationsInput | string
    filePath?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    totalRuns?: IntFieldUpdateOperationsInput | number
    avgPassRate?: FloatFieldUpdateOperationsInput | number
    currentPassRate?: FloatFieldUpdateOperationsInput | number
    avgDuration?: FloatFieldUpdateOperationsInput | number
    currentCoverage?: FloatFieldUpdateOperationsInput | number
    avgCoverage?: FloatFieldUpdateOperationsInput | number
    totalFixes?: IntFieldUpdateOperationsInput | number
    flakyTests?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: EnumTestHealthScoreFieldUpdateOperationsInput | $Enums.TestHealthScore
    totalTests?: IntFieldUpdateOperationsInput | number
    criticalTests?: IntFieldUpdateOperationsInput | number
    lastFailureReason?: NullableStringFieldUpdateOperationsInput | string | null
    sessions?: AnalysisSessionUncheckedUpdateManyWithoutTestFilesNestedInput
    executions?: TestExecutionUncheckedUpdateManyWithoutTestFileNestedInput
    coverage?: TestCoverageUncheckedUpdateManyWithoutTestFileNestedInput
    generations?: TestGenerationUncheckedUpdateManyWithoutTestFileNestedInput
    analyses?: TestAnalysisUncheckedUpdateManyWithoutTestFileNestedInput
  }

  export type TestFileCreateWithoutGenerationsInput = {
    id?: string
    filePath: string
    fileName: string
    firstSeen?: Date | string
    lastUpdated?: Date | string
    totalRuns?: number
    avgPassRate?: number
    currentPassRate?: number
    avgDuration?: number
    currentCoverage?: number
    avgCoverage?: number
    totalFixes?: number
    flakyTests?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: $Enums.TestHealthScore
    totalTests?: number
    criticalTests?: number
    lastFailureReason?: string | null
    sessions?: AnalysisSessionCreateNestedManyWithoutTestFilesInput
    executions?: TestExecutionCreateNestedManyWithoutTestFileInput
    coverage?: TestCoverageCreateNestedManyWithoutTestFileInput
    fixes?: TestFixCreateNestedManyWithoutTestFileInput
    analyses?: TestAnalysisCreateNestedManyWithoutTestFileInput
  }

  export type TestFileUncheckedCreateWithoutGenerationsInput = {
    id?: string
    filePath: string
    fileName: string
    firstSeen?: Date | string
    lastUpdated?: Date | string
    totalRuns?: number
    avgPassRate?: number
    currentPassRate?: number
    avgDuration?: number
    currentCoverage?: number
    avgCoverage?: number
    totalFixes?: number
    flakyTests?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: $Enums.TestHealthScore
    totalTests?: number
    criticalTests?: number
    lastFailureReason?: string | null
    sessions?: AnalysisSessionUncheckedCreateNestedManyWithoutTestFilesInput
    executions?: TestExecutionUncheckedCreateNestedManyWithoutTestFileInput
    coverage?: TestCoverageUncheckedCreateNestedManyWithoutTestFileInput
    fixes?: TestFixUncheckedCreateNestedManyWithoutTestFileInput
    analyses?: TestAnalysisUncheckedCreateNestedManyWithoutTestFileInput
  }

  export type TestFileCreateOrConnectWithoutGenerationsInput = {
    where: TestFileWhereUniqueInput
    create: XOR<TestFileCreateWithoutGenerationsInput, TestFileUncheckedCreateWithoutGenerationsInput>
  }

  export type TestFileUpsertWithoutGenerationsInput = {
    update: XOR<TestFileUpdateWithoutGenerationsInput, TestFileUncheckedUpdateWithoutGenerationsInput>
    create: XOR<TestFileCreateWithoutGenerationsInput, TestFileUncheckedCreateWithoutGenerationsInput>
    where?: TestFileWhereInput
  }

  export type TestFileUpdateToOneWithWhereWithoutGenerationsInput = {
    where?: TestFileWhereInput
    data: XOR<TestFileUpdateWithoutGenerationsInput, TestFileUncheckedUpdateWithoutGenerationsInput>
  }

  export type TestFileUpdateWithoutGenerationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    filePath?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    totalRuns?: IntFieldUpdateOperationsInput | number
    avgPassRate?: FloatFieldUpdateOperationsInput | number
    currentPassRate?: FloatFieldUpdateOperationsInput | number
    avgDuration?: FloatFieldUpdateOperationsInput | number
    currentCoverage?: FloatFieldUpdateOperationsInput | number
    avgCoverage?: FloatFieldUpdateOperationsInput | number
    totalFixes?: IntFieldUpdateOperationsInput | number
    flakyTests?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: EnumTestHealthScoreFieldUpdateOperationsInput | $Enums.TestHealthScore
    totalTests?: IntFieldUpdateOperationsInput | number
    criticalTests?: IntFieldUpdateOperationsInput | number
    lastFailureReason?: NullableStringFieldUpdateOperationsInput | string | null
    sessions?: AnalysisSessionUpdateManyWithoutTestFilesNestedInput
    executions?: TestExecutionUpdateManyWithoutTestFileNestedInput
    coverage?: TestCoverageUpdateManyWithoutTestFileNestedInput
    fixes?: TestFixUpdateManyWithoutTestFileNestedInput
    analyses?: TestAnalysisUpdateManyWithoutTestFileNestedInput
  }

  export type TestFileUncheckedUpdateWithoutGenerationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    filePath?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    totalRuns?: IntFieldUpdateOperationsInput | number
    avgPassRate?: FloatFieldUpdateOperationsInput | number
    currentPassRate?: FloatFieldUpdateOperationsInput | number
    avgDuration?: FloatFieldUpdateOperationsInput | number
    currentCoverage?: FloatFieldUpdateOperationsInput | number
    avgCoverage?: FloatFieldUpdateOperationsInput | number
    totalFixes?: IntFieldUpdateOperationsInput | number
    flakyTests?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: EnumTestHealthScoreFieldUpdateOperationsInput | $Enums.TestHealthScore
    totalTests?: IntFieldUpdateOperationsInput | number
    criticalTests?: IntFieldUpdateOperationsInput | number
    lastFailureReason?: NullableStringFieldUpdateOperationsInput | string | null
    sessions?: AnalysisSessionUncheckedUpdateManyWithoutTestFilesNestedInput
    executions?: TestExecutionUncheckedUpdateManyWithoutTestFileNestedInput
    coverage?: TestCoverageUncheckedUpdateManyWithoutTestFileNestedInput
    fixes?: TestFixUncheckedUpdateManyWithoutTestFileNestedInput
    analyses?: TestAnalysisUncheckedUpdateManyWithoutTestFileNestedInput
  }

  export type TestAnalysisCreateManySessionInput = {
    id?: string
    testFileId: string
    patterns: JsonNullValueInput | InputJsonValue
    antiPatterns: JsonNullValueInput | InputJsonValue
    suggestions: JsonNullValueInput | InputJsonValue
    context: JsonNullValueInput | InputJsonValue
    timestamp?: Date | string
  }

  export type TestFileUpdateWithoutSessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    filePath?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    totalRuns?: IntFieldUpdateOperationsInput | number
    avgPassRate?: FloatFieldUpdateOperationsInput | number
    currentPassRate?: FloatFieldUpdateOperationsInput | number
    avgDuration?: FloatFieldUpdateOperationsInput | number
    currentCoverage?: FloatFieldUpdateOperationsInput | number
    avgCoverage?: FloatFieldUpdateOperationsInput | number
    totalFixes?: IntFieldUpdateOperationsInput | number
    flakyTests?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: EnumTestHealthScoreFieldUpdateOperationsInput | $Enums.TestHealthScore
    totalTests?: IntFieldUpdateOperationsInput | number
    criticalTests?: IntFieldUpdateOperationsInput | number
    lastFailureReason?: NullableStringFieldUpdateOperationsInput | string | null
    executions?: TestExecutionUpdateManyWithoutTestFileNestedInput
    coverage?: TestCoverageUpdateManyWithoutTestFileNestedInput
    fixes?: TestFixUpdateManyWithoutTestFileNestedInput
    generations?: TestGenerationUpdateManyWithoutTestFileNestedInput
    analyses?: TestAnalysisUpdateManyWithoutTestFileNestedInput
  }

  export type TestFileUncheckedUpdateWithoutSessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    filePath?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    totalRuns?: IntFieldUpdateOperationsInput | number
    avgPassRate?: FloatFieldUpdateOperationsInput | number
    currentPassRate?: FloatFieldUpdateOperationsInput | number
    avgDuration?: FloatFieldUpdateOperationsInput | number
    currentCoverage?: FloatFieldUpdateOperationsInput | number
    avgCoverage?: FloatFieldUpdateOperationsInput | number
    totalFixes?: IntFieldUpdateOperationsInput | number
    flakyTests?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: EnumTestHealthScoreFieldUpdateOperationsInput | $Enums.TestHealthScore
    totalTests?: IntFieldUpdateOperationsInput | number
    criticalTests?: IntFieldUpdateOperationsInput | number
    lastFailureReason?: NullableStringFieldUpdateOperationsInput | string | null
    executions?: TestExecutionUncheckedUpdateManyWithoutTestFileNestedInput
    coverage?: TestCoverageUncheckedUpdateManyWithoutTestFileNestedInput
    fixes?: TestFixUncheckedUpdateManyWithoutTestFileNestedInput
    generations?: TestGenerationUncheckedUpdateManyWithoutTestFileNestedInput
    analyses?: TestAnalysisUncheckedUpdateManyWithoutTestFileNestedInput
  }

  export type TestFileUncheckedUpdateManyWithoutSessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    filePath?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    totalRuns?: IntFieldUpdateOperationsInput | number
    avgPassRate?: FloatFieldUpdateOperationsInput | number
    currentPassRate?: FloatFieldUpdateOperationsInput | number
    avgDuration?: FloatFieldUpdateOperationsInput | number
    currentCoverage?: FloatFieldUpdateOperationsInput | number
    avgCoverage?: FloatFieldUpdateOperationsInput | number
    totalFixes?: IntFieldUpdateOperationsInput | number
    flakyTests?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    healthScore?: EnumTestHealthScoreFieldUpdateOperationsInput | $Enums.TestHealthScore
    totalTests?: IntFieldUpdateOperationsInput | number
    criticalTests?: IntFieldUpdateOperationsInput | number
    lastFailureReason?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type TestAnalysisUpdateWithoutSessionInput = {
    id?: StringFieldUpdateOperationsInput | string
    patterns?: JsonNullValueInput | InputJsonValue
    antiPatterns?: JsonNullValueInput | InputJsonValue
    suggestions?: JsonNullValueInput | InputJsonValue
    context?: JsonNullValueInput | InputJsonValue
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    testFile?: TestFileUpdateOneRequiredWithoutAnalysesNestedInput
  }

  export type TestAnalysisUncheckedUpdateWithoutSessionInput = {
    id?: StringFieldUpdateOperationsInput | string
    testFileId?: StringFieldUpdateOperationsInput | string
    patterns?: JsonNullValueInput | InputJsonValue
    antiPatterns?: JsonNullValueInput | InputJsonValue
    suggestions?: JsonNullValueInput | InputJsonValue
    context?: JsonNullValueInput | InputJsonValue
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TestAnalysisUncheckedUpdateManyWithoutSessionInput = {
    id?: StringFieldUpdateOperationsInput | string
    testFileId?: StringFieldUpdateOperationsInput | string
    patterns?: JsonNullValueInput | InputJsonValue
    antiPatterns?: JsonNullValueInput | InputJsonValue
    suggestions?: JsonNullValueInput | InputJsonValue
    context?: JsonNullValueInput | InputJsonValue
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TestExecutionCreateManyTestFileInput = {
    id?: string
    executedAt?: Date | string
    passed: boolean
    duration: number
    errorMessage?: string | null
    testResults: JsonNullValueInput | InputJsonValue
    environment: string
    commitHash?: string | null
    performance?: NullableJsonNullValueInput | InputJsonValue
  }

  export type TestCoverageCreateManyTestFileInput = {
    id?: string
    measuredAt?: Date | string
    coveragePercent: number
    linesCovered: JsonNullValueInput | InputJsonValue
    linesUncovered: JsonNullValueInput | InputJsonValue
    branchCoverage?: NullableJsonNullValueInput | InputJsonValue
    functionCoverage?: NullableJsonNullValueInput | InputJsonValue
    suggestedAreas?: NullableJsonNullValueInput | InputJsonValue
    coverageType: string
  }

  export type TestFixCreateManyTestFileInput = {
    id?: string
    appliedAt?: Date | string
    fixType: $Enums.FixType
    problem: string
    solution: string
    successful: boolean
    confidenceScore: number
    beforeState: JsonNullValueInput | InputJsonValue
    afterState: JsonNullValueInput | InputJsonValue
    patternUsed?: string | null
    impactScore: number
  }

  export type TestGenerationCreateManyTestFileInput = {
    id?: string
    generatedAt?: Date | string
    generationType: $Enums.GenerationType
    newTests: JsonNullValueInput | InputJsonValue
    accepted: boolean
    targetArea: string
    coverageImprovement: number
    generationStrategy: string
    context: JsonNullValueInput | InputJsonValue
  }

  export type TestAnalysisCreateManyTestFileInput = {
    id?: string
    sessionId: string
    patterns: JsonNullValueInput | InputJsonValue
    antiPatterns: JsonNullValueInput | InputJsonValue
    suggestions: JsonNullValueInput | InputJsonValue
    context: JsonNullValueInput | InputJsonValue
    timestamp?: Date | string
  }

  export type AnalysisSessionUpdateWithoutTestFilesInput = {
    id?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumSessionStatusFieldUpdateOperationsInput | $Enums.SessionStatus
    context?: NullableJsonNullValueInput | InputJsonValue
    decisions?: AnalysisSessionUpdatedecisionsInput | InputJsonValue[]
    operations?: AnalysisSessionUpdateoperationsInput | InputJsonValue[]
    analyses?: TestAnalysisUpdateManyWithoutSessionNestedInput
  }

  export type AnalysisSessionUncheckedUpdateWithoutTestFilesInput = {
    id?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumSessionStatusFieldUpdateOperationsInput | $Enums.SessionStatus
    context?: NullableJsonNullValueInput | InputJsonValue
    decisions?: AnalysisSessionUpdatedecisionsInput | InputJsonValue[]
    operations?: AnalysisSessionUpdateoperationsInput | InputJsonValue[]
    analyses?: TestAnalysisUncheckedUpdateManyWithoutSessionNestedInput
  }

  export type AnalysisSessionUncheckedUpdateManyWithoutTestFilesInput = {
    id?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumSessionStatusFieldUpdateOperationsInput | $Enums.SessionStatus
    context?: NullableJsonNullValueInput | InputJsonValue
    decisions?: AnalysisSessionUpdatedecisionsInput | InputJsonValue[]
    operations?: AnalysisSessionUpdateoperationsInput | InputJsonValue[]
  }

  export type TestExecutionUpdateWithoutTestFileInput = {
    id?: StringFieldUpdateOperationsInput | string
    executedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    passed?: BoolFieldUpdateOperationsInput | boolean
    duration?: FloatFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    testResults?: JsonNullValueInput | InputJsonValue
    environment?: StringFieldUpdateOperationsInput | string
    commitHash?: NullableStringFieldUpdateOperationsInput | string | null
    performance?: NullableJsonNullValueInput | InputJsonValue
  }

  export type TestExecutionUncheckedUpdateWithoutTestFileInput = {
    id?: StringFieldUpdateOperationsInput | string
    executedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    passed?: BoolFieldUpdateOperationsInput | boolean
    duration?: FloatFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    testResults?: JsonNullValueInput | InputJsonValue
    environment?: StringFieldUpdateOperationsInput | string
    commitHash?: NullableStringFieldUpdateOperationsInput | string | null
    performance?: NullableJsonNullValueInput | InputJsonValue
  }

  export type TestExecutionUncheckedUpdateManyWithoutTestFileInput = {
    id?: StringFieldUpdateOperationsInput | string
    executedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    passed?: BoolFieldUpdateOperationsInput | boolean
    duration?: FloatFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    testResults?: JsonNullValueInput | InputJsonValue
    environment?: StringFieldUpdateOperationsInput | string
    commitHash?: NullableStringFieldUpdateOperationsInput | string | null
    performance?: NullableJsonNullValueInput | InputJsonValue
  }

  export type TestCoverageUpdateWithoutTestFileInput = {
    id?: StringFieldUpdateOperationsInput | string
    measuredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    coveragePercent?: FloatFieldUpdateOperationsInput | number
    linesCovered?: JsonNullValueInput | InputJsonValue
    linesUncovered?: JsonNullValueInput | InputJsonValue
    branchCoverage?: NullableJsonNullValueInput | InputJsonValue
    functionCoverage?: NullableJsonNullValueInput | InputJsonValue
    suggestedAreas?: NullableJsonNullValueInput | InputJsonValue
    coverageType?: StringFieldUpdateOperationsInput | string
  }

  export type TestCoverageUncheckedUpdateWithoutTestFileInput = {
    id?: StringFieldUpdateOperationsInput | string
    measuredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    coveragePercent?: FloatFieldUpdateOperationsInput | number
    linesCovered?: JsonNullValueInput | InputJsonValue
    linesUncovered?: JsonNullValueInput | InputJsonValue
    branchCoverage?: NullableJsonNullValueInput | InputJsonValue
    functionCoverage?: NullableJsonNullValueInput | InputJsonValue
    suggestedAreas?: NullableJsonNullValueInput | InputJsonValue
    coverageType?: StringFieldUpdateOperationsInput | string
  }

  export type TestCoverageUncheckedUpdateManyWithoutTestFileInput = {
    id?: StringFieldUpdateOperationsInput | string
    measuredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    coveragePercent?: FloatFieldUpdateOperationsInput | number
    linesCovered?: JsonNullValueInput | InputJsonValue
    linesUncovered?: JsonNullValueInput | InputJsonValue
    branchCoverage?: NullableJsonNullValueInput | InputJsonValue
    functionCoverage?: NullableJsonNullValueInput | InputJsonValue
    suggestedAreas?: NullableJsonNullValueInput | InputJsonValue
    coverageType?: StringFieldUpdateOperationsInput | string
  }

  export type TestFixUpdateWithoutTestFileInput = {
    id?: StringFieldUpdateOperationsInput | string
    appliedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    fixType?: EnumFixTypeFieldUpdateOperationsInput | $Enums.FixType
    problem?: StringFieldUpdateOperationsInput | string
    solution?: StringFieldUpdateOperationsInput | string
    successful?: BoolFieldUpdateOperationsInput | boolean
    confidenceScore?: FloatFieldUpdateOperationsInput | number
    beforeState?: JsonNullValueInput | InputJsonValue
    afterState?: JsonNullValueInput | InputJsonValue
    patternUsed?: NullableStringFieldUpdateOperationsInput | string | null
    impactScore?: FloatFieldUpdateOperationsInput | number
  }

  export type TestFixUncheckedUpdateWithoutTestFileInput = {
    id?: StringFieldUpdateOperationsInput | string
    appliedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    fixType?: EnumFixTypeFieldUpdateOperationsInput | $Enums.FixType
    problem?: StringFieldUpdateOperationsInput | string
    solution?: StringFieldUpdateOperationsInput | string
    successful?: BoolFieldUpdateOperationsInput | boolean
    confidenceScore?: FloatFieldUpdateOperationsInput | number
    beforeState?: JsonNullValueInput | InputJsonValue
    afterState?: JsonNullValueInput | InputJsonValue
    patternUsed?: NullableStringFieldUpdateOperationsInput | string | null
    impactScore?: FloatFieldUpdateOperationsInput | number
  }

  export type TestFixUncheckedUpdateManyWithoutTestFileInput = {
    id?: StringFieldUpdateOperationsInput | string
    appliedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    fixType?: EnumFixTypeFieldUpdateOperationsInput | $Enums.FixType
    problem?: StringFieldUpdateOperationsInput | string
    solution?: StringFieldUpdateOperationsInput | string
    successful?: BoolFieldUpdateOperationsInput | boolean
    confidenceScore?: FloatFieldUpdateOperationsInput | number
    beforeState?: JsonNullValueInput | InputJsonValue
    afterState?: JsonNullValueInput | InputJsonValue
    patternUsed?: NullableStringFieldUpdateOperationsInput | string | null
    impactScore?: FloatFieldUpdateOperationsInput | number
  }

  export type TestGenerationUpdateWithoutTestFileInput = {
    id?: StringFieldUpdateOperationsInput | string
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    generationType?: EnumGenerationTypeFieldUpdateOperationsInput | $Enums.GenerationType
    newTests?: JsonNullValueInput | InputJsonValue
    accepted?: BoolFieldUpdateOperationsInput | boolean
    targetArea?: StringFieldUpdateOperationsInput | string
    coverageImprovement?: FloatFieldUpdateOperationsInput | number
    generationStrategy?: StringFieldUpdateOperationsInput | string
    context?: JsonNullValueInput | InputJsonValue
  }

  export type TestGenerationUncheckedUpdateWithoutTestFileInput = {
    id?: StringFieldUpdateOperationsInput | string
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    generationType?: EnumGenerationTypeFieldUpdateOperationsInput | $Enums.GenerationType
    newTests?: JsonNullValueInput | InputJsonValue
    accepted?: BoolFieldUpdateOperationsInput | boolean
    targetArea?: StringFieldUpdateOperationsInput | string
    coverageImprovement?: FloatFieldUpdateOperationsInput | number
    generationStrategy?: StringFieldUpdateOperationsInput | string
    context?: JsonNullValueInput | InputJsonValue
  }

  export type TestGenerationUncheckedUpdateManyWithoutTestFileInput = {
    id?: StringFieldUpdateOperationsInput | string
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    generationType?: EnumGenerationTypeFieldUpdateOperationsInput | $Enums.GenerationType
    newTests?: JsonNullValueInput | InputJsonValue
    accepted?: BoolFieldUpdateOperationsInput | boolean
    targetArea?: StringFieldUpdateOperationsInput | string
    coverageImprovement?: FloatFieldUpdateOperationsInput | number
    generationStrategy?: StringFieldUpdateOperationsInput | string
    context?: JsonNullValueInput | InputJsonValue
  }

  export type TestAnalysisUpdateWithoutTestFileInput = {
    id?: StringFieldUpdateOperationsInput | string
    patterns?: JsonNullValueInput | InputJsonValue
    antiPatterns?: JsonNullValueInput | InputJsonValue
    suggestions?: JsonNullValueInput | InputJsonValue
    context?: JsonNullValueInput | InputJsonValue
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    session?: AnalysisSessionUpdateOneRequiredWithoutAnalysesNestedInput
  }

  export type TestAnalysisUncheckedUpdateWithoutTestFileInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionId?: StringFieldUpdateOperationsInput | string
    patterns?: JsonNullValueInput | InputJsonValue
    antiPatterns?: JsonNullValueInput | InputJsonValue
    suggestions?: JsonNullValueInput | InputJsonValue
    context?: JsonNullValueInput | InputJsonValue
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TestAnalysisUncheckedUpdateManyWithoutTestFileInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionId?: StringFieldUpdateOperationsInput | string
    patterns?: JsonNullValueInput | InputJsonValue
    antiPatterns?: JsonNullValueInput | InputJsonValue
    suggestions?: JsonNullValueInput | InputJsonValue
    context?: JsonNullValueInput | InputJsonValue
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}