# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import asyncio
from asyncio.base_events import BaseEventLoop
import pytest

# Monkeypatch asyncio BaseEventLoop._check_closed to ignore "Event loop is closed" 
# errors during teardown of async ssl transports.
original_check_closed = BaseEventLoop._check_closed

def patched_check_closed(self):
    try:
        original_check_closed(self)
    except RuntimeError as e:
        if "Event loop is closed" not in str(e):
            raise

BaseEventLoop._check_closed = patched_check_closed
