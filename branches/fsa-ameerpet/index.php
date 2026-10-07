<?php
// Compatibility fallback for servers that use index.php as the default document.
readfile(__DIR__ . '/index.html');
