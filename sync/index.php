<?php

/**
 * Sync Engine
 *
 * This is the bootstrap file for the email syncing engine, called
 * from the CLI or managed via a supervisor. It works by checking
 * a list of saved IMAP credentials and runs through a flow of tasks.
 */

use App\Log as Log
  , voku\db\DB as DB
  , App\Console as Console
  , Pimple\Container as Container;

// Set up paths
define( 'BASEPATH', __DIR__ );
define( 'DATE_DATABASE', 'Y-m-d H:i:s' );
define( 'DBSCRIPTS', BASEPATH .'/db/*.sql' );
date_default_timezone_set( 'UTC' );

// Load the vendor libraries
require( BASEPATH . '/vendor/autoload.php' );

// Load configuration files and parse the CLI arguments
$default = parse_ini_file( BASEPATH .'/config/default.ini', TRUE );
$local = parse_ini_file( BASEPATH .'/config/local.ini', TRUE );
$config = array_replace_recursive( $default, $local );

// Set up dependency container and register all services
$di = new Container();

// Store the configuration as a service
$di[ 'config' ] = $config;

// Console/CLI service
$di[ 'console' ] = new Console( $config );
$di[ 'cli' ] = function ( $c ) {
    return $c[ 'console' ]->getCLI();
};

// MySQLi service, this uses Voku's library
$di[ 'db' ] = function ( $c ) {
    $dbConfig = $c[ 'config' ][ 'sql' ];
    return DB::getInstance(
        $dbConfig[ 'hostname' ],
        $dbConfig[ 'username' ],
        $dbConfig[ 'password' ],
        $dbConfig[ 'database' ],
        $dbConfig[ 'port' ],
        $dbConfig[ 'charset' ],
        $exitOnError = FALSE,
        $echoOnError = FALSE );
};

// Logging service
$di[ 'log' ] = function ( $c ) {
    $stdout = ( $c[ 'console' ]->interactive === TRUE );
    $log = new Log( $c[ 'config' ][ 'log' ], $stdout );
    return $log->getLogger();
};

// Statically set the services in the base model
\App\Model::setDb( $di[ 'db' ] );
\App\Model::setCLI( $di[ 'cli' ] );
\App\Model::setLog( $di[ 'log' ] );
\App\Model::setConfig( $di[ 'config' ] );

// Parse the CLI
$di[ 'console' ]->init();

// Run initialization checks, like if the database exists or if there
// are email accounts saved. This may prompt the user to add an account
// if we're running in interactive mode.
try {
    $startup = new \App\Startup( $di );
    $startup->run();
}
catch ( \Exception $e ) {
    if ( $di[ 'console' ]->interactive === TRUE ) {
        $di[ 'cli' ]->boldRedBackgroundBlack( $e->getMessage() );
        $di[ 'cli' ]->br();

        if ( $config[ 'app' ][ 'stacktrace' ] ) {
            $di[ 'cli' ]->comment( $e->getTraceAsString() );
            $di[ 'cli' ]->br();
        }
    }
    else {
        if ( $config[ 'app' ][ 'stacktrace' ] ) {
            $di[ 'log' ]->addError(
                $e->getMessage() . PHP_EOL . $e->getTraceAsString() );
        }
        else {
            $di[ 'log' ]->addError( $e->getMessage() );
        }
    }
}