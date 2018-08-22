<?php

namespace App\Actions;

use App\Actions;
use App\Folders;
use App\Exceptions\ServerException;
use App\Model\Message as MessageModel;

class Unspam extends Delete
{
    /**
     * Removing from Spam is just deleting the spam message. All other
     * copies remain in tact.
     *
     * @see Base for params
     */
    public function update(MessageModel $message, Folders $folders, array $options = [])
    {
        if (! $folders->getSpamId()) {
            throw new ServerException('No Spam folder found', ERR_NO_SPAM_FOLDER);
        }

        $options[Actions::FROM_FOLDER_ID] = $folders->getSpamId();

        $this->restore($message, $folders, $options);
    }
}
